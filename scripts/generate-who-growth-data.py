#!/usr/bin/env python3
"""Convert downloaded WHO percentile workbooks into compact TypeScript data."""

from __future__ import annotations

import argparse
import math
import zipfile
from pathlib import Path
from xml.etree import ElementTree

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
PERCENTILES = ("P3", "P15", "P50", "P85", "P97")


def read_workbook(path: Path, sparse_age: bool = False) -> tuple[str, list[float], dict[str, list[float]]]:
    with zipfile.ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(item.itertext()) for item in root.findall("m:si", NS)]

        sheet = ElementTree.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = sheet.findall(".//m:sheetData/m:row", NS)

        def cell_value(cell):
            value = cell.find("m:v", NS)
            if value is None:
                return None
            raw = value.text or ""
            return shared[int(raw)] if cell.attrib.get("t") == "s" else float(raw)

        headers = {cell_value(cell): index for index, cell in enumerate(rows[0].findall("m:c", NS))}
        axis_name = next(name for name in ("Age", "Day", "Month", "Length", "Height") if name in headers)
        percentile_columns = {percentile: headers[percentile] for percentile in PERCENTILES}
        axis = []
        values = {percentile: [] for percentile in PERCENTILES}

        for row in rows[1:]:
            cells = row.findall("m:c", NS)
            row_values = [cell_value(cell) for cell in cells]
            axis_value = row_values[headers[axis_name]]
            if sparse_age and axis_name in ("Age", "Day") and int(axis_value) % 7 != 0:
                continue
            axis.append(axis_value)
            for percentile, column in percentile_columns.items():
                values[percentile].append(row_values[column])

        return axis_name, axis, values


def number(value: float) -> str:
    if not math.isfinite(value):
        raise ValueError(f"non-finite value: {value}")
    return format(value, ".6g")


def array(values: list[float]) -> str:
    chunks = []
    for start in range(0, len(values), 16):
        chunks.append(", ".join(number(value) for value in values[start : start + 16]))
    return "[\n      " + ",\n      ".join(chunks) + "\n    ]"


def table(path: Path, sparse_age: bool) -> str:
    axis_name, axis, values = read_workbook(path, sparse_age)
    unit = "months" if axis_name == "Month" else "cm" if axis_name in ("Length", "Height") else "days"
    axis_array = array(axis)
    value_arrays = ",\n".join(
        f"      {percentile}: {array(values[percentile])}" for percentile in PERCENTILES
    )
    return f"{{\n    axisUnit: \"{unit}\",\n    axis: {axis_array},\n    values: {{\n{value_arrays}\n    }}\n  }}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("name_path", nargs="+", metavar="NAME=PATH")
    args = parser.parse_args()
    tables = {}
    for item in args.name_path:
        name, raw_path = item.split("=", 1)
        tables[name] = table(Path(raw_path), sparse_age=True)

    rendered = """// Generated from the official WHO percentile workbooks. Do not edit by hand.
// Sources: https://www.who.int/tools/child-growth-standards and
// https://www.who.int/tools/growth-reference-data-for-5to19-years

export type WhoPercentile = \"P3\" | \"P15\" | \"P50\" | \"P85\" | \"P97\";
export type WhoAxisUnit = \"days\" | \"months\" | \"cm\";
export type WhoGrowthTable = {
  axisUnit: WhoAxisUnit;
  axis: number[];
  values: Record<WhoPercentile, number[]>;
};

export const whoGrowthTables = {
""" + ",\n".join(f"  {name}: {content}" for name, content in tables.items()) + "\n} as const satisfies Record<string, WhoGrowthTable>;\n"
    args.output.write_text(rendered, encoding="utf-8")


if __name__ == "__main__":
    main()
