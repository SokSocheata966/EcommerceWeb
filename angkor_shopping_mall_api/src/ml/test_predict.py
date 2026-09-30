from predict import recommend


USER_ID = "b834adf6-a596-424b-995f-b41af8ed2fbb"


results = recommend(
    USER_ID,
    count=10
)


for item in results.get("recommendations", []):
    print(
        item["product_id"],
        item["score"]
    )