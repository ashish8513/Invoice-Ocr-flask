import pandas as pd
import os

DB_PATH = r"D:\Invoice-Ocr\database\invoices.xlsx"


def init_excel():
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError("Excel file not found")

    xl = pd.ExcelFile(DB_PATH)

    with pd.ExcelWriter(
        DB_PATH,
        engine="openpyxl",
        mode="a",
        if_sheet_exists="overlay"
    ) as writer:

        if "SalesOrderHeader" not in xl.sheet_names:
            pd.DataFrame(columns=[
                "SalesOrderID",
                "OrderDate",
                "CustomerName",
                "TotalDue",
                "TaxAmt"
            ]).to_excel(
                writer,
                sheet_name="SalesOrderHeader",
                index=False
            )

        if "SalesOrderDetail" not in xl.sheet_names:
            pd.DataFrame(columns=[
                "SalesOrderID",
                "ProductNumber",
                "OrderQty",
                "UnitPrice"
            ]).to_excel(
                writer,
                sheet_name="SalesOrderDetail",
                index=False
            )


def save_to_excel(header, items):
    header_df = pd.DataFrame([header])
    items_df = pd.DataFrame(items)

    with pd.ExcelWriter(
        DB_PATH,
        engine="openpyxl",
        mode="a",
        if_sheet_exists="overlay"
    ) as writer:

        header_sheet = writer.book["SalesOrderHeader"]
        detail_sheet = writer.book["SalesOrderDetail"]

        header_row = header_sheet.max_row
        detail_row = detail_sheet.max_row

        header_df.to_excel(
            writer,
            sheet_name="SalesOrderHeader",
            index=False,
            header=False,
            startrow=header_row
        )

        items_df.to_excel(
            writer,
            sheet_name="SalesOrderDetail",
            index=False,
            header=False,
            startrow=detail_row
        )
