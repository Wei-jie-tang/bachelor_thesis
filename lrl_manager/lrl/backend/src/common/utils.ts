import path from "path";
import fs from "fs";
import _ from "lodash";
import resources from "./resources.json";
export function getAddressFromKeystore() {
  //const addressFile = fs.readdirSync(path.join(__dirname, "keystore"))[0];
  const nodeAddress = "0x4332e9bcf17c38b1fce75194d87e2c2c975fa7c1";
  // "0x" +
  // _.toLower(
  // JSON.parse(fs.readFileSync(path.join("keystore", addressFile)).toString())
  // .address
  // );

  return nodeAddress;
}
export function getResourcesFromFile(addr: string) {
  return resources[addr];
}
export function getResourcesFromEnvironment() {
  return {
    cpu_pct: process.env.CPU,
    clockrate_GHz: process.env.CLOCKRATE,
    RAM_GB: process.env.RAM,
    BW_utilization: process.env.BANDWIDTH_UTIL,
    RTT_ms: process.env.RTT,
    cores: process.env.CORES,
    BW: process.env.BANDWIDTH,
  };
}

export function transferFile(filePath: string, destination: string) {}

export function sendFile(filePath: string, IP: string, route: string) {
  //TODO: Implement function here
}

export function sendString(data: string, IP: string, route: string) {
  //TODO: Implement function here
}

/// MATRIX operations
export function normalize(matrix: number[][]) {
  const numRows = matrix.length;
  const numColumns = matrix[0].length;
  const columnWeights = {};
  /// Calculate Column Weights ///
  for (let j = 0; j < numColumns; j++) {
    let temp = 0;
    for (let i = 0; i < numRows; i++) {
      temp += matrix[i][j] ** 2;
    }
    Object.defineProperty(columnWeights, `col${j}`, {
      value: Math.sqrt(temp),
    });
  }

  /// Normalize ///
  const normalized = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    normalized[i] = [];
    for (let j = 0; j < numColumns; j++) {
      const entry = matrix[i][j];
      const weight = columnWeights[`col${j}`];
      if (entry === 0) {
        normalized[i].push(0);
        continue;
      }
      const val = entry / weight;
      normalized[i].push(val);
    }
  }

  return normalized;
}

// 2. Calculate weighted normalized Matrix
export function weight(matrix: number[][], weights: number[]) {
  const numRows = matrix.length;
  const numColumns = matrix[0].length;
  if (numColumns !== weights.length)
    throw new Error("Must have same number of weights and decision criteria.");

  const weights_normalized = weights.map((val) => val / vectorSum(weights));

  const weighted = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    weighted[i] = [];
    for (let j = 0; j < numColumns; j++) {
      weighted[i].push(matrix[i][j] * weights_normalized[j]);
    }
  }

  return weighted;
}
export function vectorSum(vector: number[]) {
  let temp = 0;
  for (let i = 0; i < vector.length; i++) {
    temp += vector[i];
  }
  return temp;
}

/**
 * Elementwise subtraction of two arrays
 * @param arr1 Minuend
 * @param arr2 Subtrahend
 */
export function sub(arr1: number[], arr2: number[]) {
  if (arr1.length !== arr2.length)
    throw new Error("Arrays must be of same length");

  const temp = [];
  for (let i = 0; i < arr1.length; i++) {
    temp.push(arr1[i] - arr2[i]);
  }
  return temp;
}

export function euclidianDistance(vector1: number[], vector2: number[]) {
  const dim = vector1.length;

  if (dim !== vector2.length)
    throw new Error("Vectors must be of the same dimension.");

  let temp = 0;
  for (let i = 0; i < dim; i++) {
    temp += (vector1[i] - vector2[i]) ** 2;
  }

  return Math.sqrt(temp);
}

export function print2x2Matrix(matrix: number[][]) {
  const numRows = matrix.length;

  const matrix_rounded = matrix.map((row) => {
    return row.map((val) => {
      if (isNaN(val)) return val;
      return val.toFixed(2);
    });
  });

  const maxCellSize = Math.max(
    ...matrix_rounded.map((row) =>
      Math.max(...row.map((val) => val.toString().length))
    )
  );

  for (let row of matrix) {
    console.log(makeRowStr(row, maxCellSize));
  }
}

function makeRowStr(row: number[], cellSize: number) {
  let row_str = "";
  for (let val of row) {
    row_str += makeMatrixCellStr(val, cellSize);
  }

  return row_str;
}

function makeMatrixCellStr(content: number, size: number) {
  if (typeof content !== "number") {
    return "|" + "-".repeat(size);
  }

  const contentSize = content.toString().length;

  let padding = size - contentSize;
  let cell_str =
    contentSize <= size
      ? content.toString()
      : content.toString().slice(0, size);
  while (padding > 0) {
    cell_str = padding % 2 !== 0 ? " " + cell_str : cell_str + " ";
    padding -= 1;
  }
  return "|" + cell_str;
}
