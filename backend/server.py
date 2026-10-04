import json, os, sqlite3, hashlib, secrets, re, io, base64
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from datetime import datetime, timezone
from compliance import check_project
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
except Exception:
    canvas=None

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except Exception:
    psycopg2=None


ROOT=os.path.dirname(__file__)
DATA_DIR=os.environ.get("DOMAI_DATA_DIR",ROOT)
os.makedirs(DATA_DIR,exist_ok=True)
DB=os.path.join(DATA_DIR,"domai.db")
LEGAL_VERSION="2026-10-04-v1"
APP_VERSION="DomAI v110 Commercial Launch Ready"

SELLER_ENV = {
    "name": "DOMAI_SELLER_NAME",
    "inn": "DOMAI_SELLER_INN",
    "status": "DOMAI_SELLER_STATUS",
    "email": "DOMAI_SELLER_EMAIL",
    "address": "DOMAI_SELLER_ADDRESS",
}

def seller_config():
    return {k: os.environ.get(v, "").strip() for k, v in SELLER_ENV.items()}

def seller_config_complete():
    c=seller_config()
    return all(c.values())

def launch_gates():
    c=seller_config()
    missing=[v for k,v in SELLER_ENV.items() if not os.environ.get(v, "").strip()]
    return {
        "seller_details": seller_config_complete(),
        "missing_env": missing,
        "payment_configured": payment_configured(),
        "admin_bootstrap_configured": bool(os.environ.get("DOMAI_ADMIN_BOOTSTRAP_KEY")),
        "https_expected": True,
        "ready_for_paid_sales": seller_config_complete() and payment_configured() and bool(os.environ.get("DOMAI_ADMIN_BOOTSTRAP_KEY")),
    }



def production_db_configured():
    return bool(os.environ.get("DATABASE_URL") and psycopg2)

def secure_hash(password):
    # Prefer PBKDF2 in stdlib; no external dependency required.
    salt=secrets.token_bytes(16)
    dk=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,310000)
    return "pbkdf2$310000$"+base64.urlsafe_b64encode(salt).decode()+"$"+base64.urlsafe_b64encode(dk).decode()

def verify_hash(password, stored):
    try:
        if stored.startswith("pbkdf2$"):
            _,iters,salt_s,dk_s=stored.split("$",3)
            salt=base64.urlsafe_b64decode(salt_s.encode())
            dk=base64.urlsafe_b64decode(dk_s.encode())
            calc=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,int(iters))
            return secrets.compare_digest(calc,dk)
        return secrets.compare_digest(ph(password),stored)
    except Exception:
        return False

def db():
    c=sqlite3.connect(DB)
    c.row_factory=sqlite3.Row
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL,is_admin INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,event TEXT,data TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,consent_type TEXT NOT NULL,legal_version TEXT NOT NULL,accepted_at TEXT NOT NULL,ip TEXT);
    """)
    return c

def now(): return datetime.now(timezone.utc).isoformat()
def ph(s): return hashlib.sha256(s.encode()).hexdigest()
def token(): return secrets.token_urlsafe(32)

def estimate(p):
    area=float(p.get("area") or 0)
    quality=p.get("finish","standard")
    rates={"economy":65000,"standard":90000,"premium":130000}
    rate=rates.get(quality,90000)
    house=area*rate
    engineering=house*.08
    reserve=house*.12
    total=house+engineering+reserve
    return {"currency":"RUB","area_m2":area,"rate_rub_m2":rate,"house_estimate":round(house),"engineering_reserve":round(engineering),"contingency":round(reserve),"total_estimate":round(total),"note":"Предварительная оценка, не смета и не оферта."}

def plan(p):
    rooms=p.get("rooms") or []
    area=float(p.get("area") or 100)
    n=max(len(rooms),1)
    side=max((area)**0.5,8)
    cols=2 if n>2 else 1
    rows=(n+cols-1)//cols
    rw=side/cols; rh=side/rows
    out=[]
    for i,r in enumerate(rooms):
        x=(i%cols)*rw; y=(i//cols)*rh
        out.append({"name":r.get("name","Комната"),"area_m2":r.get("area",round(area/n,1)),"x":round(x,2),"y":round(y,2),"w":round(rw,2),"h":round(rh,2)})
    return {"width_m":round(side,2),"height_m":round(side,2),"rooms":out,"note":"Автоматический эскиз; геометрия требует проверки архитектором."}



def parse_num(text, patterns, default=None):
    for pat in patterns:
        m=re.search(pat,text,re.I)
        if m:
            try:return float(m.group(1).replace(",","."))
            except: pass
    return default




def load_catalog():
    try:
        with open(os.path.join(ROOT,"materials.json"),"r",encoding="utf-8") as f:return json.load(f)
    except:return []

def catalog_quote(house, finish="standard"):
    c=load_catalog()
    area=max(1,float(house.get("w",10))*float(house.get("h",10))*int(house.get("floors",1) or 1))
    perimeter=2*(float(house.get("w",10))+float(house.get("h",10)))
    qty={"wall_gasblock_400":round(perimeter*3*int(house.get("floors",1) or 1)*0.40,1),
         "roof_metal":round(float(house.get("w",10))*float(house.get("h",10))*1.15,1),
         "window_pvc":max(4,int(area/25)),
         "door_entry":max(2,int(area/45)),
         "finish_basic":round(area,1)}
    if finish=="premium":
        qty={"wall_gasblock_400":qty["wall_gasblock_400"],"roof_soft":qty["roof_metal"],"window_premium":qty["window_pvc"],"door_premium":qty["door_entry"],"finish_plus":qty["finish_basic"]}
    rows=[]; total=0
    for item in c:
        if item["id"] in qty:
            amount=round(qty[item["id"]]*item["price"]);total+=amount
            rows.append({**item,"quantity":qty[item["id"]],"amount_rub":amount})
    return {"items":rows,"total_rub":total,"catalog_version":"demo-2026-10-03",
            "note":"Каталог демонстрационный. Цены не являются текущими предложениями продавцов."}

def catalog_savings(house,finish="standard"):
    quote=catalog_quote(house,finish); c={x["id"]:x for x in load_catalog()}
    savings=[]
    for x in quote["items"]:
        for aid in x.get("alternatives",[]):
            if aid in c:
                diff=(x["price"]-c[aid]["price"])*x["quantity"]
                if diff>0:savings.append({"from":x["name"],"to":c[aid]["name"],"saving_rub":round(diff)})
    return sorted(savings,key=lambda x:x["saving_rub"],reverse=True)


def load_real_catalog():
    try:
        with open(os.path.join(ROOT,"real_materials.json"),"r",encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

REGION_FACTORS = {
    "Москва": 1.00, "Санкт-Петербург": 1.00, "Московская область": 1.03,
    "Татарстан": 0.97, "Свердловская область": 1.02, "Мурманская область": 1.12,
    "Красноярский край": 1.10, "ХМАО": 1.12, "ЯНАО": 1.16, "Другое": 1.08
}



def load_suppliers():
    try:
        with open(os.path.join(ROOT,"suppliers.json"),"r",encoding="utf-8") as f: return json.load(f)
    except Exception: return []

def load_supplier_offers():
    try:
        with open(os.path.join(ROOT,"supplier_offers.json"),"r",encoding="utf-8") as f: return json.load(f)
    except Exception: return []

def supplier_compare(house, region="Москва"):
    q=real_catalog_quote(house,region=region)
    qty={x["id"]:x["quantity"] for x in q["items"]}
    offers=load_supplier_offers()
    suppliers={x["supplier_id"]:x for x in load_suppliers()}
    rows=[]
    for o in offers:
        if o["material_id"] in qty:
            factor=REGION_FACTORS.get(region,REGION_FACTORS["Другое"])
            unit=round(o["price"]*factor,2)
            amount=round(unit*qty[o["material_id"]])
            rows.append({**o,"supplier_name":suppliers.get(o["supplier_id"],{}).get("name",o["supplier_id"]),
                         "quantity":qty[o["material_id"]],"regional_unit_price":unit,"amount_rub":amount})
    groups={}
    for r in rows: groups.setdefault(r["material_id"],[]).append(r)
    result=[]
    for mid,items in groups.items():
        items.sort(key=lambda x:x["amount_rub"])
        best=items[0]
        result.append({"material_id":mid,"offers":items,"best_offer":best})
    return result


def delivery_estimate(total_rub, weight_kg=0, distance_km=20, vehicle_t=1.5):
    # Transparent DomAI estimate, not a supplier tariff.
    base_by_t={0.5:1800,1.5:2800,3.5:5200,5:7500,7.5:10500}
    base=base_by_t.get(float(vehicle_t),2800)
    distance=max(0,float(distance_km)-10)*45
    weight_factor=1.0 if weight_kg<=1500 else 1.25 if weight_kg<=3500 else 1.55
    return round((base+distance)*weight_factor)

def cart_from_quote(q):
    return [{"id":x["id"],"name":x["name"],"supplier":x["supplier"],"quantity":x["quantity"],
             "unit":x["unit"],"unit_price_rub":x["regional_price_rub"],"amount_rub":x["amount_rub"],
             "source_url":x["source_url"]} for x in q["items"]]


def real_catalog_quote(house, finish="standard", region="Москва"):
    c=load_real_catalog()
    W=float(house.get("w",10)); D=float(house.get("h",10)); floors=int(house.get("floors",1) or 1)
    area=max(1,W*D*floors)
    perimeter=2*(W+D)
    qty={
        "wall_gasblock_400_real":round(perimeter*3*floors*0.40,1),
        "roof_metal_real":round(W*D*1.15,1),
        "window_real":max(4,int(area/25)),
        "door_real":max(2,int(area/45))
    }
    factor=REGION_FACTORS.get(region,REGION_FACTORS["Другое"])
    rows=[]; total=0
    for item in c:
        if item["id"] not in qty: continue
        base=float(item["price"]); regional=round(base*factor,2)
        amount=round(qty[item["id"]]*regional); total+=amount
        rows.append({**item,"quantity":qty[item["id"]],"base_price_rub":base,
                     "regional_price_rub":regional,"amount_rub":amount,
                     "region_factor":factor})
    return {"items":rows,"total_rub":total,"region":region,"region_factor":factor,
            "catalog_version":"real-public-baseline-2026-10-03",
            "note":"Цены взяты из публичных карточек продавца и являются ориентиром на дату проверки. Региональный коэффициент — расчётная модель DomAI, а не цена продавца; доставка, объём, акции и условия оплаты могут изменить итог."}

def compare_real_catalog(house, region="Москва"):
    q=real_catalog_quote(house,region=region)
    c={x["id"]:x for x in load_real_catalog()}
    out=[]
    for x in q["items"]:
        for aid in x.get("alternatives",[]):
            if aid in c:
                alt=c[aid]
                saving=(x["regional_price_rub"]-alt["price"]*q["region_factor"])*x["quantity"]
                out.append({"category":x["category"],"from":x["name"],"to":alt["name"],
                            "saving_rub":round(saving),"source_url":alt["source_url"]})
    return sorted(out,key=lambda x:x["saving_rub"],reverse=True)


def detailed_estimate(house, floorplan, finish="standard"):
    W=float(house.get("w",10)); D=float(house.get("h",10)); floors=int(house.get("floors",1) or 1)
    area=max(1,W*D*floors)
    perimeter=2*(W+D)
    wall_h=3.0
    wall_area=perimeter*wall_h*floors
    # Conceptual quantities
    items=[
      ("Фундамент / основание","м²",round(W*D,1),{"economy":18000,"standard":24000,"premium":32000}.get(finish,24000)),
      ("Наружные стены","м²",round(wall_area,1),{"economy":7000,"standard":10000,"premium":14500}.get(finish,10000)),
      ("Перекрытия","м²",round(W*D*max(0,floors-1),1),{"economy":6500,"standard":8500,"premium":11500}.get(finish,8500)),
      ("Кровля","м²",round(W*D*1.15,1),{"economy":5500,"standard":8000,"premium":12000}.get(finish,8000)),
      ("Окна — предварительно","шт",max(4,int(area/25)),{"economy":35000,"standard":55000,"premium":85000}.get(finish,55000)),
      ("Двери — предварительно","шт",max(3,int(area/35)),{"economy":18000,"standard":30000,"premium":55000}.get(finish,30000)),
      ("Внутренняя отделка","м²",round(area,1),{"economy":12000,"standard":19000,"premium":30000}.get(finish,19000)),
      ("Инженерные системы — резерв","м²",round(area,1),{"economy":9000,"standard":14000,"premium":22000}.get(finish,14000))
    ]
    rows=[];total=0
    for name,unit,qty,price in items:
        amount=round(qty*price)
        total+=amount
        rows.append({"name":name,"unit":unit,"quantity":qty,"unit_price_rub":price,"amount_rub":amount})
    return {"area_m2":round(area,1),"finish":finish,"items":rows,"total_rub":total,
            "reserve_10pct_rub":round(total*.10),"total_with_reserve_rub":round(total*1.10),
            "note":"Предварительная концептуальная оценка. Не является сметой, коммерческим предложением или расчётом для закупки."}

def generate_floorplan(house, rooms, floors=1):
    floors=max(1,min(int(floors or 1),3))
    W=float(house.get("w",10)); D=float(house.get("h",10))
    per_floor=[[] for _ in range(floors)]
    # distribute requested rooms across floors
    for i,r in enumerate(rooms):
        per_floor[i%floors].append(r)
    plans=[]
    for fi,rs in enumerate(per_floor):
        if not rs: continue
        cols=2 if len(rs)>2 else 1
        rows=(len(rs)+cols-1)//cols
        cw=W/cols; ch=D/rows
        rr=[]
        for i,r in enumerate(rs):
            rr.append({"name":r.get("name","Комната"),"area_m2":r.get("area",0),
                       "x":round((i%cols)*cw,2),"y":round((i//cols)*ch,2),
                       "w":round(cw,2),"h":round(ch,2)})
        # add staircase core to non-ground floors / upper circulation
        if fi>0:
            rr.append({"name":"Лестница","area_m2":5,"x":0,"y":0,"w":2.2,"h":2.2})
        plans.append({"floor":fi+1,"rooms":rr})
    # derive doors/windows for each room boundary
    for p in plans:
        doors=[]; windows=[]
        for r in p["rooms"]:
            doors.append({"room":r["name"],"x":round(r["x"]+min(1.0,r["w"]/2),2),"y":round(r["y"],2),"w":.9,"h":.12})
            windows.append({"room":r["name"],"x":round(r["x"]+r["w"]/2,2),"y":round(r["y"]+r["h"],2),"w":1.4,"h":.12})
        p["doors"]=doors;p["windows"]=windows
    return {"floors":plans,"dimensions_m":{"width":W,"depth":D},
            "note":"Автоматическая концептуальная планировка. Не является рабочей архитектурной документацией."}

def ai_plan(prompt):
    t=(prompt or "").lower()
    W=parse_num(t,[r'участ(?:ок|ка)?\s*(?:размером\s*)?(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)'],None)
    dims=re.search(r'(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)\s*(?:м|метр)',t)
    if dims:
        W=float(dims.group(1).replace(",",".")); H=float(dims.group(2).replace(",","."))
    else:
        W=20; H=30
    area=parse_num(t,[r'дом[а]?\s*(?:площадью|на)\s*(\d+(?:[.,]\d+)?)\s*(?:м2|м²|кв\.?\s*м)',r'(\d+(?:[.,]\d+)?)\s*(?:м2|м²|кв\.?\s*м).*дом'],120)
    floors=int(parse_num(t,[r'(\d+)\s*[- ]?\s*этаж'],2))
    rooms=[]
    def add(n,a): rooms.append({"name":n,"area":a})
    if "гараж" in t: garage=True
    else: garage=False
    if "бан" in t: bath=True
    else: bath=False
    if "террас" in t: terrace=True
    else: terrace=False
    bedrooms=3 if ("3 спаль" in t or "три спаль" in t) else (2 if "спаль" in t else 0)
    add("Кухня-гостиная",round(area*.28,1))
    for i in range(max(1,bedrooms)): add("Спальня "+str(i+1),round(area*.13,1))
    add("Санузел",round(area*.06,1))
    add("Холл",round(area*.12,1))
    add("Техпомещение",round(area*.06,1))
    used=sum(x["area"] for x in rooms)
    rooms[0]["area"]=round(rooms[0]["area"]+max(0,area-used),1)
    hw=max(8,min(W-4,(area/1.6)**0.5*1.15)); hd=max(8,min(H-6,area/hw))
    house={"type":"house","name":"Дом","w":round(hw,1),"h":round(hd,1),"x":2,"y":4,"floors":floors,"roof":3}
    objs=[]
    if garage: objs.append({"type":"garage","name":"Гараж на 2 машины" if "2" in t and "машин" in t else "Гараж","w":6,"h":6,"x":house["x"]+house["w"]+1,"y":house["y"]})
    if bath: objs.append({"type":"bath","name":"Баня","w":5,"h":5,"x":max(1,W-7),"y":max(1,H-8)})
    if terrace: objs.append({"type":"terrace","name":"Терраса","w":max(4,round(hw*.45,1)),"h":3,"x":house["x"]+2,"y":house["y"]+house["h"]+1})
    if "сад" in t or "дерев" in t: objs.append({"type":"garden","name":"Сад","w":max(5,round(W*.35,1)),"h":max(6,round(H*.35,1)),"x":max(1,W-max(5,W*.35)-2),"y":max(1,H-max(6,H*.35)-2)})
    if "мангал" in t or "барбекю" in t: objs.append({"type":"bbq","name":"Мангал","w":3,"h":3,"x":max(1,W-5),"y":max(1,H-12)})
    fp=generate_floorplan(house,rooms,floors)
    return {"site":{"width_m":W,"height_m":H},"house":house,"objects":objs,"rooms":rooms,"floorplan":fp,
            "explanation":"План построен автоматически по текстовому описанию. Перед реальным проектированием нужны точные данные участка, применимые требования и профессиональная проверка."}

def site_check(site):
    W=float(site.get("width_m") or 0); H=float(site.get("height_m") or 0)
    objects=site.get("objects") or []
    warnings=[]; blockers=[]
    if W<=0 or H<=0: blockers.append("Не заданы корректные размеры участка.")
    for o in objects:
        x=float(o.get("x",0)); y=float(o.get("y",0)); w=float(o.get("w",0)); h=float(o.get("h",0))
        if x<0 or y<0 or x+w>W or y+h>H:
            warnings.append(f"Объект «{o.get('name','объект')}» выходит за границы участка.")
        if o.get("type")=="house" and min(x,y,W-(x+w),H-(y+h))<3:
            warnings.append("Дом расположен близко к границе участка. Требуется проверка применимых отступов.")
    # rectangle collision check
    for i,a in enumerate(objects):
        for b in objects[i+1:]:
            ax,ay,aw,ah=map(float,[a.get("x",0),a.get("y",0),a.get("w",0),a.get("h",0)])
            bx,by,bw,bh=map(float,[b.get("x",0),b.get("y",0),b.get("w",0),b.get("h",0)])
            if ax < bx+bw and ax+aw > bx and ay < by+bh and ay+ah > by:
                warnings.append(f"Объекты «{a.get('name','')}» и «{b.get('name','')}» пересекаются.")
    return {"level":"RED" if blockers else ("YELLOW" if warnings else "GREEN"),
            "blockers":blockers,"warnings":warnings,
            "note":"Автоматическая геометрическая проверка не является градостроительной экспертизой."}


def seed_v24_price_history():
    ensure_v24_tables()
    offers=load_supplier_offers()
    con=sqlite3.connect(DB); cur=con.cursor()
    for o in offers:
        cur.execute("SELECT 1 FROM price_history_v24 WHERE material_id=? AND supplier_id=? AND checked_at=?",
                    (o["material_id"],o["supplier_id"],o["checked_at"]))
        if not cur.fetchone():
            cur.execute("INSERT INTO price_history_v24(material_id,supplier_id,price,checked_at,source_url) VALUES(?,?,?,?,?)",
                        (o["material_id"],o["supplier_id"],o["price"],o["checked_at"],o.get("source_url")))
    con.commit(); con.close()


PLANS = {
    "free": {"name":"Бесплатно","price_rub":0,"period":"forever","projects":1},
    "home": {"name":"Дом","price_rub":990,"period":"one_time","projects":5},
    "pro": {"name":"PRO","price_rub":2990,"period":"one_time","projects":20},
    "profi": {"name":"Профи","price_rub":9900,"period":"month","projects":999}
}

def ensure_business_tables():
    c=db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS orders(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      amount_rub INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      provider TEXT DEFAULT '',
      provider_payment_id TEXT DEFAULT '',
      payment_url TEXT DEFAULT ''
    );
    """)
    c.commit(); c.close()

def static_file(handler, path):
    base=os.path.abspath(os.path.join(ROOT,"..","frontend"))
    target=os.path.abspath(os.path.join(base, path.lstrip("/")))
    if not target.startswith(base+os.sep) or not os.path.isfile(target):
        return False
    ext=os.path.splitext(target)[1].lower()
    types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
           ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
           ".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"}
    b=open(target,"rb").read()
    handler.send_response(200); handler.send_header("Content-Type",types.get(ext,"application/octet-stream"))
    handler.send_header("Content-Length",str(len(b))); handler.end_headers(); handler.wfile.write(b)
    return True


def payment_configured():
    return bool(os.environ.get("YOOKASSA_SHOP_ID") and os.environ.get("YOOKASSA_SECRET_KEY"))

def create_yookassa_payment(order_id, amount_rub, description, return_url):
    shop=os.environ["YOOKASSA_SHOP_ID"]; secret=os.environ["YOOKASSA_SECRET_KEY"]
    idem=secrets.token_urlsafe(24)
    payload={
      "amount":{"value":f"{amount_rub:.2f}","currency":"RUB"},
      "capture":True,
      "confirmation":{"type":"redirect","return_url":return_url},
      "description":description,
      "metadata":{"order_id":str(order_id)}
    }
    raw=json.dumps(payload).encode()
    req=Request("https://api.yookassa.ru/v3/payments",data=raw,method="POST")
    import base64
    auth=base64.b64encode(f"{shop}:{secret}".encode()).decode()
    req.add_header("Authorization","Basic "+auth)
    req.add_header("Idempotence-Key",idem)
    req.add_header("Content-Type","application/json")
    try:
        with urlopen(req,timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error":"payment_provider_error","detail":str(e)}

def activate_order(order_id, provider_payment_id):
    ensure_business_tables()
    c=db(); c.execute("UPDATE orders SET status='paid',provider_payment_id=? WHERE id=?",
                      (provider_payment_id,order_id)); c.commit(); c.close()
    grant_entitlement(order_id)


def ensure_v56_tables():
    c=db()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS entitlements(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      source_order_id INTEGER,
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      status TEXT NOT NULL
    );
    """)
    c.commit(); c.close()

def grant_entitlement(order_id):
    ensure_v56_tables()
    c=db()
    row=c.execute("SELECT user_id,plan,status FROM orders WHERE id=?",(order_id,)).fetchone()
    if not row or row["status"]!="paid":
        c.close(); return False
    p=PLANS.get(row["plan"],PLANS["free"])
    exp=None
    if p["period"]=="month":
        from datetime import timedelta
        exp=(datetime.now(timezone.utc)+timedelta(days=31)).isoformat()
    c.execute("INSERT INTO entitlements(user_id,plan,source_order_id,starts_at,expires_at,status) VALUES(?,?,?,?,?,?)",
              (row["user_id"],row["plan"],order_id,now(),exp,"active"))
    c.commit(); c.close(); return True

def current_entitlement(uid):
    ensure_v56_tables()
    c=db()
    rows=c.execute("SELECT * FROM entitlements WHERE user_id=? AND status='active' ORDER BY id DESC",(uid,)).fetchall()
    c.close()
    for r in rows:
        if not r["expires_at"] or r["expires_at"]>now():
            return dict(r)
    return {"plan":"free","status":"active"}

def admin_uid(uid):
    if not uid:return False
    c=db(); r=c.execute("SELECT is_admin FROM users WHERE id=?",(uid,)).fetchone(); c.close()
    return bool(r and r["is_admin"])

def user_stats():
    ensure_v56_tables()
    c=db()
    users=c.execute("SELECT COUNT(*) n FROM users").fetchone()["n"]
    projects=c.execute("SELECT COUNT(*) n FROM projects").fetchone()["n"]
    orders=c.execute("SELECT COUNT(*) n FROM orders").fetchone()["n"]
    paid=c.execute("SELECT COUNT(*) n FROM orders WHERE status='paid'").fetchone()["n"]
    revenue=c.execute("SELECT COALESCE(SUM(amount_rub),0) n FROM orders WHERE status='paid'").fetchone()["n"]
    c.close()
    return {"users":users,"projects":projects,"orders":orders,"paid_orders":paid,"revenue_rub":revenue}


class H(BaseHTTPRequestHandler):
    def sendj(self,x,code=200):
        b=json.dumps(x,ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Content-Length",str(len(b)))
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("X-Frame-Options","DENY")
        self.send_header("Referrer-Policy","strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy","default-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;")
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", ""))
        self.send_header("Access-Control-Allow-Headers","Content-Type,Authorization"); self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS"); self.end_headers(); self.wfile.write(b)
    def options(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin", "")); self.send_header("Access-Control-Allow-Headers","Content-Type,Authorization"); self.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS"); self.end_headers()
    def do_OPTIONS(self): self.options()
    def do_HEAD(self):
        if self.path=="/":
            self.send_response(200); self.send_header("Content-Type","text/html; charset=utf-8"); self.end_headers(); return
        self.send_response(404); self.end_headers()
    def body(self):
        n=int(self.headers.get("Content-Length","0")); return json.loads(self.rfile.read(n) or b"{}")
    def user(self):
        h=self.headers.get("Authorization","")
        if not h.startswith("Bearer "): return None
        c=db(); r=c.execute("SELECT user_id FROM sessions WHERE token=?",(h[7:],)).fetchone(); c.close()
        return r["user_id"] if r else None
    def audit(self,uid,event,data):
        c=db(); c.execute("INSERT INTO audit(user_id,event,data,created_at) VALUES(?,?,?,?)",(uid,event,json.dumps(data,ensure_ascii=False),now())); c.commit(); c.close()
    def do_GET(self):
        if self.path=="/api/health": return self.sendj({"ok":True,"app":APP_VERSION,"legal_version":LEGAL_VERSION,"sales":launch_gates()})
        if self.path=="/api/public-config":
            c=seller_config()
            return self.sendj({"app":APP_VERSION,"legal_version":LEGAL_VERSION,"seller":c,"sales":launch_gates()})
        if self.path=="/api/launch-gates":
            return self.sendj(launch_gates())
        # Render legal pages from the public seller configuration so production does not ship [ФИО]/[ИНН] placeholders.
        if self.path in ("/legal/offer.html","/legal/privacy.html","/legal/refund.html","/legal/engineering.html"):
            rel=self.path.lstrip("/")
            target=os.path.abspath(os.path.join(ROOT,"..","frontend",rel))
            if os.path.isfile(target):
                txt=open(target,"r",encoding="utf-8").read()
                c=seller_config()
                replacements={"[ФИО]":c["name"] or "Реквизиты продавца не заполнены",
                              "[ИНН]":c["inn"] or "не заполнен",
                              "[статус]":c["status"] or "не заполнен",
                              "[e-mail]":c["email"] or "не заполнен",
                              "[адрес]":c["address"] or "не заполнен"}
                for a,b in replacements.items(): txt=txt.replace(a,b)
                b=txt.encode("utf-8")
                self.send_response(200); self.send_header("Content-Type","text/html; charset=utf-8"); self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b); return
        uid=self.user()
        if self.path=="/api/leads":
            ensure_v25_tables()
            con=sqlite3.connect(DB); cur=con.cursor()
            rows=cur.execute("SELECT id,project_id,name,phone,email,comment,status,created_at FROM leads_v25 WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()
            con.close()
            return self.sendj([{"id":r[0],"project_id":r[1],"name":r[2],"phone":r[3],"email":r[4],"comment":r[5],"status":r[6],"created_at":r[7]} for r in rows])
        if self.path=="/api/projects":
            if not uid:return self.sendj({"error":"auth_required"},401)
            c=db(); rows=c.execute("SELECT id,name,data,created_at,updated_at FROM projects WHERE user_id=? ORDER BY updated_at DESC",(uid,)).fetchall(); c.close()
            return self.sendj([{"id":r["id"],"name":r["name"],"data":json.loads(r["data"]),"created_at":r["created_at"],"updated_at":r["updated_at"]} for r in rows])
        if self.path=="/api/plans":
            return self.sendj(PLANS)
        if self.path=="/api/orders":
            if not uid:return self.sendj({"error":"auth_required"},401)
            ensure_business_tables(); c=db()
            rows=c.execute("SELECT id,plan,amount_rub,status,created_at,provider,payment_url FROM orders WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()
            c.close()
            return self.sendj([dict(r) for r in rows])
        if self.path=="/api/me":
            if not uid:return self.sendj({"error":"auth_required"},401)
            ent=current_entitlement(uid)
            c=db(); u=c.execute("SELECT id,email,created_at,is_admin FROM users WHERE id=?",(uid,)).fetchone(); c.close()
            return self.sendj({"user":dict(u),"entitlement":ent})
        if self.path=="/api/download/project":
            if not uid:return self.sendj({"error":"auth_required"},401)
            ent=current_entitlement(uid)
            if ent.get("plan")=="free":return self.sendj({"error":"paid_plan_required"},402)
            c=db(); rows=c.execute("SELECT id,name,data FROM projects WHERE user_id=? ORDER BY updated_at DESC LIMIT 1",(uid,)).fetchall(); c.close()
            if not rows:return self.sendj({"error":"no_project"},404)
            p=json.loads(rows[0]["data"]); name=rows[0]["name"]
            safe=re.sub(r"[^A-Za-zА-Яа-я0-9_-]+","_",name)[:60]
            htmlpkg=f"""<!doctype html><html><meta charset='utf-8'><title>DomAI — {safe}</title>
            <style>body{{font:14px Arial;margin:40px}}h1{{margin-bottom:4px}}.note{{padding:12px;background:#fff3cd;border:1px solid #d6bd62}}table{{border-collapse:collapse}}td{{border:1px solid #aaa;padding:6px}}</style>
            <h1>DomAI — предварительный пакет проекта</h1><h2>{name}</h2>
            <p>Тариф: {ent.get("plan")}</p><div class='note'>Предварительный концептуальный материал. Не является рабочей проектной документацией и не гарантирует согласование.</div>
            <h3>Параметры</h3><pre>{json.dumps(p,ensure_ascii=False,indent=2)}</pre>
            <button onclick='print()'>Печать / PDF</button></html>"""
            if canvas:
                buf=io.BytesIO(); pdf=canvas.Canvas(buf,pagesize=A4)
                w,h=A4; y=h-50
                pdf.setTitle("DomAI — "+name)
                pdf.setFont("Helvetica-Bold",16); pdf.drawString(40,y,"DomAI — предварительный пакет проекта"); y-=28
                pdf.setFont("Helvetica",11); pdf.drawString(40,y,"Проект: "+name); y-=20
                pdf.drawString(40,y,"Тариф: "+str(ent.get("plan"))); y-=28
                pdf.setFont("Helvetica-Bold",10); pdf.drawString(40,y,"Важно: предварительный концептуальный материал."); y-=18
                pdf.setFont("Helvetica",9)
                for line in ["Не является рабочей проектной документацией.","Не заменяет расчёты конструкций и инженерных систем.","Не гарантирует согласование или получение разрешений."]:
                    pdf.drawString(40,y,line); y-=16
                y-=10; pdf.setFont("Helvetica-Bold",12); pdf.drawString(40,y,"Параметры проекта"); y-=20
                pdf.setFont("Helvetica",9)
                raw=json.dumps(p,ensure_ascii=False,indent=2)
                for line in raw.splitlines():
                    txt=line.encode("ascii","replace").decode("ascii")[:105]
                    pdf.drawString(40,y,txt); y-=12
                    if y<45: pdf.showPage(); y=h-50; pdf.setFont("Helvetica",9)
                pdf.save(); b=buf.getvalue()
                self.send_response(200); self.send_header("Content-Type","application/pdf")
                self.send_header("Content-Disposition",f'attachment; filename="{safe}_DomAI.pdf"')
            else:
                b=htmlpkg.encode("utf-8")
                self.send_response(200); self.send_header("Content-Type","text/html; charset=utf-8")
                self.send_header("Content-Disposition",f'attachment; filename="{safe}_DomAI.html"')
            self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b); return
        if self.path=="/api/admin/leads":
            if not admin_uid(uid):return self.sendj({"error":"admin_required"},403)
            c=db(); rows=c.execute("SELECT * FROM leads ORDER BY created_at DESC LIMIT 200").fetchall(); c.close()
            return self.sendj([dict(x) for x in rows])
        if self.path=="/api/admin/stats":
            if not admin_uid(uid):return self.sendj({"error":"admin_required"},403)
            return self.sendj(user_stats())
        if self.path=="/api/admin/orders":
            if not admin_uid(uid):return self.sendj({"error":"admin_required"},403)
            ensure_business_tables(); c=db()
            rows=c.execute("""SELECT o.id,o.user_id,u.email,o.plan,o.amount_rub,o.status,o.created_at,o.provider
                              FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC LIMIT 200""").fetchall()
            c.close(); return self.sendj([dict(r) for r in rows])
        if self.path=="/":
            return static_file(self, "index.html") or self.sendj({"error":"not_found"},404)
        if self.path.startswith("/") and not self.path.startswith("/api/"):
            return static_file(self, self.path[1:]) or self.sendj({"error":"not_found"},404)
        return self.sendj({"error":"not_found"},404)
    def do_POST(self):
        d=self.body()
        if self.path=="/api/register":
            email=(d.get("email") or "").strip().lower(); password=d.get("password") or ""
            if len(email)<5 or len(password)<8:return self.sendj({"error":"email/password_invalid"},400)
            if d.get("legal_accept") is not True:
                return self.sendj({"error":"legal_consent_required"},400)
            c=db()
            try:
                cur=c.execute("INSERT INTO users(email,password_hash,created_at) VALUES(?,?,?)",(email,secure_hash(password),now())); uid=cur.lastrowid; c.commit()
            except sqlite3.IntegrityError:return self.sendj({"error":"email_exists"},409)
            t=token(); c.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",(t,uid,now()))
            c.execute("INSERT INTO consents(user_id,consent_type,legal_version,accepted_at,ip) VALUES(?,?,?,?,?)",(uid,"privacy_and_offer",LEGAL_VERSION,now(),self.client_address[0] if self.client_address else ""))
            c.commit(); c.close()
            return self.sendj({"token":t,"user_id":uid,"legal_version":LEGAL_VERSION})
        if self.path=="/api/login":
            c=db(); r=c.execute("SELECT id,password_hash FROM users WHERE email=?",( (d.get("email") or "").lower(),)).fetchone()
            if not r or not verify_hash(d.get("password") or "",r["password_hash"]):
                c.close(); return self.sendj({"error":"invalid_credentials"},401)
            t=token(); c.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)",(t,r["id"],now())); c.commit(); c.close()
            return self.sendj({"token":t,"user_id":r["id"]})
        if self.path=="/api/admin/bootstrap":
            key=d.get("key","")
            secret=os.environ.get("DOMAI_ADMIN_BOOTSTRAP_KEY","")
            if not secret or key!=secret:return self.sendj({"error":"forbidden"},403)
            email=(d.get("email") or "").lower().strip()
            c=db(); c.execute("UPDATE users SET is_admin=1 WHERE email=?",(email,)); c.commit()
            changed=c.total_changes; c.close()
            return self.sendj({"ok":True,"changed":changed})
        if self.path=="/api/payment/yookassa-webhook":
            ensure_business_tables()
            event=d.get("event","")
            obj=d.get("object") or {}
            pid=obj.get("id","")
            metadata=obj.get("metadata") or {}
            oid=int(metadata.get("order_id","0") or 0)
            if event=="payment.succeeded" and oid and obj.get("status")=="succeeded":
                ensure_business_tables()
                c=db(); row=c.execute("SELECT status,provider_payment_id FROM orders WHERE id=?",(oid,)).fetchone(); c.close()
                if row and row["status"]!="paid":
                    activate_order(oid,pid)
            return self.sendj({"ok":True})
        uid=self.user()
        if self.path=="/api/order":
            if not uid:return self.sendj({"error":"auth_required"},401)
            ensure_business_tables()
            plan_id=d.get("plan","free")
            if plan_id not in PLANS:return self.sendj({"error":"unknown_plan"},400)
            p=PLANS[plan_id]
            if p["price_rub"]>0 and not seller_config_complete():
                return self.sendj({"error":"seller_details_not_configured","message":"Продажа временно недоступна: владелец сервиса должен заполнить реквизиты продавца в secrets сервера."},503)
            if p["price_rub"]>0 and not payment_configured():
                return self.sendj({"error":"payment_not_configured","message":"Продажа временно недоступна: платёжный провайдер ещё не настроен."},503)
            c=db(); cur=c.execute("INSERT INTO orders(user_id,plan,amount_rub,status,created_at,provider) VALUES(?,?,?,?,?,?)",
                                  (uid,plan_id,p["price_rub"],"pending",now(),"yookassa" if payment_configured() else "manual"))
            oid=cur.lastrowid; c.commit(); c.close()
            if p["price_rub"]==0:
                activate_order(oid,"free")
                return self.sendj({"order_id":oid,"plan":plan_id,"amount_rub":0,"status":"paid","payment_url":"/"})
            if payment_configured():
                host=self.headers.get("Host","localhost:8000")
                base="https://"+host+"/payment-return"
                result=create_yookassa_payment(oid,p["price_rub"],"DomAI "+p["name"],base)
                if result.get("id"):
                    c=db(); c.execute("UPDATE orders SET provider_payment_id=?,payment_url=?,provider='yookassa' WHERE id=?",
                                      (result["id"],result.get("confirmation",{}).get("confirmation_url",""),oid)); c.commit(); c.close()
                    return self.sendj({"order_id":oid,"plan":plan_id,"amount_rub":p["price_rub"],"status":result.get("status","pending"),
                                       "payment_url":result.get("confirmation",{}).get("confirmation_url"),"provider":"yookassa"})
                return self.sendj({"order_id":oid,"status":"payment_error","detail":result.get("detail","unknown")},502)
            return self.sendj({"order_id":oid,"plan":plan_id,"amount_rub":p["price_rub"],"status":"pending",
                               "payment_url":None,"provider":"manual",
                               "message":"Добавьте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY в secrets сервера."})
        if not uid:return self.sendj({"error":"auth_required"},401)
        if self.path=="/api/leads":
            ensure_v25_tables()
            con=sqlite3.connect(DB); cur=con.cursor()
            rows=cur.execute("SELECT id,project_id,name,phone,email,comment,status,created_at FROM leads_v25 WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()
            con.close()
            return self.sendj([{"id":r[0],"project_id":r[1],"name":r[2],"phone":r[3],"email":r[4],"comment":r[5],"status":r[6],"created_at":r[7]} for r in rows])
        if self.path=="/api/projects":
            p=d.get("project") or {}; name=d.get("name") or "Новый проект"
            p["legal_version"]=LEGAL_VERSION; p["compliance"]=check_project(p); p["estimate"]=estimate(p); p["plan"]=plan(p)
            c=db(); cur=c.execute("INSERT INTO projects(user_id,name,data,created_at,updated_at) VALUES(?,?,?,?,?)",(uid,name,json.dumps(p,ensure_ascii=False),now(),now())); c.commit(); pid=cur.lastrowid; c.close()
            self.audit(uid,"project_create",{"project_id":pid})
            return self.sendj({"id":pid,"name":name,"data":p},201)
        if self.path=="/api/leads":
            ensure_v25_tables()
            con=sqlite3.connect(DB); cur=con.cursor()
            rows=cur.execute("SELECT id,project_id,name,phone,email,comment,status,created_at FROM leads_v25 WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()
            con.close()
            return self.sendj([{"id":r[0],"project_id":r[1],"name":r[2],"phone":r[3],"email":r[4],"comment":r[5],"status":r[6],"created_at":r[7]} for r in rows])
        if self.path=="/api/projects":
            return self.sendj(v24_project_list(uid))
        if self.path.startswith("/api/projects/"):
            try: pid=int(self.path.rsplit("/",1)[1])
            except: return self.sendj({"error":"bad project id"},400)
            item=v24_project_get(uid,pid)
            return self.sendj(item or {"error":"not found"},404)
        if self.path=="/api/favorites":
            return self.sendj(v24_favorites(uid))
        if self.path=="/api/price-history":
            ensure_v24_tables()
            con=sqlite3.connect(DB); cur=con.cursor()
            rows=cur.execute("SELECT material_id,supplier_id,price,checked_at,source_url FROM price_history_v24 ORDER BY checked_at DESC LIMIT 100").fetchall()
            con.close()
            return self.sendj([{"material_id":r[0],"supplier_id":r[1],"price":r[2],"checked_at":r[3],"source_url":r[4]} for r in rows])
        if self.path=="/api/catalog":
            return self.sendj({"demo":load_catalog(),"real":load_real_catalog(),"real_baseline_date":"2026-10-03"})
        if self.path=="/api/catalog/real":
            p=d.get("project") or {}; region=p.get("region","Москва")
            result=real_catalog_quote(p.get("house") or {},p.get("finish","standard"),region)
            result["comparisons"]=compare_real_catalog(p.get("house") or {},region)
            self.audit(uid,"real_catalog_quote",{"total":result["total_rub"],"region":region})
            return self.sendj(result)

        if self.path=="/api/projects/save":
            p=d.get("project") or {}; name=str(d.get("name") or "Мой проект").strip()[:120]
            pid=v24_project_save(uid,name,p)
            return self.sendj({"ok":True,"id":pid,"name":name})
        if self.path=="/api/favorites/toggle":
            mid=str(d.get("material_id") or "").strip()
            if not mid:return self.sendj({"error":"material_id required"},400)
            return self.sendj({"ok":True,"favorite":v24_toggle_favorite(uid,mid),"favorites":v24_favorites(uid)})
        if self.path=="/api/lead":
            ensure_v25_tables()
            p=d.get("project") or {}
            lead=v25_create_lead(uid,p.get("project_id"),str(d.get("name") or "").strip()[:120],
                                 str(d.get("phone") or "").strip()[:40],
                                 str(d.get("email") or "").strip()[:160],
                                 str(d.get("comment") or "").strip()[:1000])
            self.audit(uid,"lead_create",{"lead_id":lead})
            return self.sendj({"ok":True,"lead_id":lead,"message":"Заявка сохранена в базе DomAI."})
        if self.path=="/api/visual-pdf-offer":
            p=d.get("project") or {}
            path=make_visual_offer(p)
            with open(path,"rb") as f: blob=f.read()
            self.send_response(200); self.send_header("Content-Type","application/pdf")
            self.send_header("Content-Disposition",'attachment; filename="DomAI_visual_offer.pdf"')
            self.send_header("Content-Length",str(len(blob))); self.end_headers(); self.wfile.write(blob); return
        if self.path=="/api/report":
            p=d.get("project") or {}
            return self.sendj(v25_report(p))

        if self.path=="/api/pdf-offer":
            p=d.get("project") or {}
            path=make_v26_pdf(p)
            with open(path,"rb") as f: blob=f.read()
            self.send_response(200); self.send_header("Content-Type","application/pdf")
            self.send_header("Content-Disposition",'attachment; filename="DomAI_offer.pdf"')
            self.send_header("Content-Length",str(len(blob))); self.end_headers(); self.wfile.write(blob); return
        if self.path=="/api/suppliers":
            return self.sendj(load_suppliers())
        if self.path=="/api/market/compare":
            p=d.get("project") or {}; region=p.get("region","Москва")
            result=supplier_compare(p.get("house") or {},region)
            self.audit(uid,"supplier_compare",{"region":region})
            return self.sendj({"region":region,"groups":result,
                                "note":"Предложения являются демонстрационным слоем каталога. Значение stock=проверить означает, что DomAI не получил live-подтверждение наличия."})
        if self.path=="/api/market/checkout":
            p=d.get("project") or {}; region=p.get("region","Москва")
            distance=float(p.get("distance_km",20) or 20)
            weight=float(p.get("weight_kg",0) or 0)
            vehicle=float(p.get("vehicle_t",1.5) or 1.5)
            q=real_catalog_quote(p.get("house") or {},p.get("finish","standard"),region)
            q["cart"]=cart_from_quote(q)
            q["delivery"]={"estimated_rub":delivery_estimate(q["total_rub"],weight,distance,vehicle),
                           "distance_km":distance,"weight_kg":weight,"vehicle_t":vehicle,
                           "note":"Расчёт доставки DomAI является ориентиром. Фактическую стоимость определяет перевозчик/магазин."}
            q["grand_total_rub"]=q["total_rub"]+q["delivery"]["estimated_rub"]
            self.audit(uid,"market_checkout",{"grand_total":q["grand_total_rub"],"region":region})
            return self.sendj(q)
        if self.path=="/api/estimate/detailed":
            p=d.get("project") or {}
            h=p.get("house") or {"w":10,"h":10,"floors":1}
            result=detailed_estimate(h,p.get("floorplan") or {},p.get("finish","standard"))
            self.audit(uid,"detailed_estimate",{"total":result["total_with_reserve_rub"]})
            return self.sendj(result)
        if self.path=="/api/ai/plan":
            result=ai_plan(d.get("prompt",""))
            self.audit(uid,"ai_plan",{"prompt":d.get("prompt","")[:500]})
            return self.sendj(result)
        if self.path=="/api/site/check":
            site=d.get("site") or {}
            result=site_check(site)
            self.audit(uid,"site_check",result)
            return self.sendj(result)
        if self.path=="/api/generate":
            p=d.get("project") or {}; p["estimate"]=estimate(p); p["plan"]=plan(p); p["compliance"]=check_project(p); self.audit(uid,"generate",{"level":p["compliance"]["level"]})
            return self.sendj(p)
        return self.sendj({"error":"not_found"},404)

if __name__=="__main__":
    db().close()
    port=int(os.environ.get("PORT","8000"))
    print(APP_VERSION,"running on",port)
    HTTPServer(("0.0.0.0",port),H).serve_forever()

try:
    seed_v24_price_history()
except Exception:
    pass
def make_visual_offer(project):
    pdf_path=os.path.join(DATA_DIR,"domai_visual_offer.pdf")
    font_name="Helvetica"
    fp="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if os.path.exists(fp):
        pdfmetrics.registerFont(TTFont("DomAIVisual",fp)); font_name="DomAIVisual"
    styles=getSampleStyleSheet()
    title=ParagraphStyle("vtitle",parent=styles["Title"],fontName=font_name,fontSize=21,leading=25,alignment=TA_CENTER,spaceAfter=14)
    h1=ParagraphStyle("vh1",parent=styles["Heading1"],fontName=font_name,fontSize=14,leading=18,spaceBefore=6,spaceAfter=8)
    body=ParagraphStyle("vbody",parent=styles["BodyText"],fontName=font_name,fontSize=9,leading=12)
    small=ParagraphStyle("vsmall",parent=body,fontSize=7.3,leading=9)
    doc=SimpleDocTemplate(pdf_path,pagesize=A4,rightMargin=40,leftMargin=40,topMargin=40,bottomMargin=40)
    story=[]; name=project.get("name","Проект дома"); plot=project.get("plot") or {}; house=project.get("house") or {}
    pw=float(plot.get("w",20)); pd=float(plot.get("d",30)); W=float(house.get("w",10)); D=float(house.get("h",10)); floors=int(house.get("floors",1) or 1)
    area=round(W*D*floors,1)
    story += [Spacer(1,35),Paragraph("DomAI",title),Paragraph("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",title),Paragraph(name,title),
              Paragraph("Концепция дома, участка и предварительного подбора материалов",body),Spacer(1,25),
              Paragraph("Дата: "+datetime.datetime.now().strftime("%d.%m.%Y"),body),PageBreak()]
    # Site plan
    sc=min(420/max(pw,1),270/max(pd,1)); sw,sd=pw*sc,pd*sc
    d=Drawing(sw+60,sd+55); d.add(Rect(25,25,sw,sd,fillColor=colors.whitesmoke,strokeWidth=1))
    hw,hd=W*sc,D*sc; hx=25+(sw-hw)/2; hy=25+(sd-hd)/2
    d.add(Rect(hx,hy,hw,hd,fillColor=colors.lightgrey,strokeWidth=1)); d.add(String(hx+5,hy+hd/2,"ДОМ",fontSize=8))
    d.add(String(25,sd+38,f"Участок {pw:g} × {pd:g} м",fontSize=9))
    story += [Paragraph("1. Схема участка",h1),d,Spacer(1,8),
              Paragraph("Концептуальная схема. Не учитывает автоматически градостроительные ограничения, охранные зоны, рельеф и инженерные сети.",small),PageBreak()]
    # Floor plan
    sc=min(420/max(W,1),270/max(D,1)); fw,fh=W*sc,D*sc
    d=Drawing(fw+60,fh+55); d.add(Rect(25,25,fw,fh,strokeWidth=1))
    names=["Гостиная / кухня","Спальня 1","Спальня 2","Холл"]
    for i,n in enumerate(names):
        x=25+(i%2)*fw/2; y=25+(i//2)*fh/2
        d.add(Rect(x,y,fw/2,fh/2,fillColor=colors.whitesmoke,strokeWidth=.7))
        d.add(String(x+5,y+fh/4,n,fontSize=7))
    d.add(String(25,fh+38,f"Концептуальный план · {floors} этаж(а)",fontSize=9))
    story += [Paragraph("2. Концептуальный 2D-план",h1),d,Spacer(1,8),
              Paragraph("Расположение помещений демонстрационное и требует уточнения заказчиком и проверки специалистом.",small),PageBreak()]
    # Axon
    d=Drawing(430,280); ox,oy=150,45; sx=20; sy=12; ww=W*sx; dd=D*sy; z=floors*38
    p1=(ox,oy);p2=(ox+ww,oy);p3=(ox+ww+dd,oy+dd);p4=(ox+dd,oy+dd)
    d.add(Polygon([p1[0],p1[1],p2[0],p2[1],p3[0],p3[1],p4[0],p4[1]],fillColor=colors.whitesmoke,strokeWidth=1))
    d.add(Polygon([p1[0],p1[1],p2[0],p2[1],p2[0],p2[1]+z,p1[0],p1[1]+z],fillColor=colors.lightgrey,strokeWidth=1))
    d.add(Polygon([p2[0],p2[1],p3[0],p3[1],p3[0],p3[1]+z,p2[0],p2[1]+z],fillColor=colors.lightgrey,strokeWidth=1))
    d.add(Polygon([p1[0],p1[1]+z,p2[0],p2[1]+z,p3[0],p3[1]+z+25,p4[0],p4[1]+z+25],fillColor=colors.whitesmoke,strokeWidth=1))
    d.add(String(25,245,"Концептуальная 3D-аксонометрия",fontSize=10))
    story += [Paragraph("3. 3D-визуализация",h1),d,PageBreak()]
    story += [Paragraph("4. Параметры и стоимость",h1)]
    q=real_catalog_quote(house,project.get("finish","standard"),project.get("region","Москва"))
    data=[["Параметр","Значение"],["Участок",f"{pw:g} × {pd:g} м"],["Дом",f"{W:g} × {D:g} м"],["Этажей",str(floors)],["Площадь этажей",f"{area:g} м²"],["Материалы",f'{q["total_rub"]:,.0f} ₽']]
    t=Table(data,colWidths=[220,260]);t.setStyle(TableStyle([("GRID",(0,0),(-1,-1),.35,colors.grey),("FONTNAME",(0,0),(-1,-1),font_name),("BACKGROUND",(0,0),(-1,0),colors.lightgrey)]))
    story += [t,Spacer(1,12),Paragraph("5. Ограничения",h1),
              Paragraph("Документ является концептуальным коммерческим предложением. Он не является рабочей проектной документацией, инженерными изысканиями, строительной сметой, экспертным заключением или разрешением на строительство. Перед реализацией необходима проверка специалистами и выполнение применимых проектных и согласовательных процедур.",body)]
    doc.build(story); return pdf_path


