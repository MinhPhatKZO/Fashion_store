import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["fasion_store"]

def init_db():
    try:
        db.products.create_index([("name", "text"), ("description", "text")])
        print("KZONE_DB: Da thiet lap Text Index.")
    except Exception as e:
        print(f"KZONE_DB Index Info: {e}")