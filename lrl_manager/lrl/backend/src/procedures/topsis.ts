import {
  normalize,
  euclidianDistance,
  weight,
  print2x2Matrix,
} from "../common/utils";
import { Resources } from "../@types/objects";

export class TOPSIS {
  decisionMatrix: number[][];
  benefitMatrix: number[];
  weightMatrix?: number[];
  resources: string[];
  candidates: string[];

  constructor(benefits: { [resource: string]: 1 | -1 }) {
    const size = Object.keys(benefits).length;
    this.decisionMatrix = [];
    this.benefitMatrix = Object.values(benefits);
    this.weightMatrix = new Array(size);
    this.weightMatrix.fill(1 / size);
    this.resources = Object.keys(benefits);
    this.candidates = [];
  }

  addCandidate(ID: string, resources: Resources): TOPSIS {
    console.log(
      `TOPSIS: addCandidate ${ID}: \n${typeof resources} ${JSON.stringify(resources)}\n`
    );
    const row = [];
    this.resources.forEach((key) => {
      row.push(resources[key]).toString();
    });

    console.log(`Adding row to decistion Matrix: `);
    console.log(`ROW: ${row}`);
    this.decisionMatrix.push(row);
    console.log(`Added row. Matrix: `);
    print2x2Matrix(this.decisionMatrix);
    this.candidates.push(ID);

    return this;
  }

  addWeights(weights: Resources): TOPSIS {
    console.log(`TOPSIS: addWeights: ${JSON.stringify(weights)}`);
    const weightMatrix_new = [];
    this.resources.forEach((key) => {
      weightMatrix_new.push(weights[key]);
    });
    this.weightMatrix = weightMatrix_new;
    return this;
  }

  getRanking(requirements?: Resources): { [candidate: string]: number } {
    console.log(`TOPSIS: getRanking \ndecision Matrix:`);
    print2x2Matrix(this.decisionMatrix);

    const numCandidates = this.decisionMatrix.length;

    // 1. Normalize decision Matrix
    const normalizedMatrix = normalize(this.decisionMatrix);
    console.log("---Normalized Matrix---");
    print2x2Matrix(normalizedMatrix);

    // 2. Calculate weighted decision Matrix
    const weightedMatrix = weight(normalizedMatrix, this.weightMatrix);
    console.log("---Weighted Matrix---");
    print2x2Matrix(normalizedMatrix);

    // 3. Determin positive and negative ideal solutions
    const positiveIdeal = zenith(weightedMatrix, this.benefitMatrix);

    const negativeIdeal = nadir(weightedMatrix, this.benefitMatrix);

    // 4. Calculate distances to PID, NID
    const positiveDistance = [];
    const negativeDistance = [];
    weightedMatrix.forEach((row) => {
      positiveDistance.push(euclidianDistance(row, positiveIdeal));
      negativeDistance.push(euclidianDistance(row, negativeIdeal));
    });

    // 5. Calculate relative closeness
    const relativeCloseness = {};
    for (let i = 0; i < numCandidates; i++) {
      Object.defineProperty(relativeCloseness, this.candidates[i], {
        value: calculateRelativeCloseness(
          positiveDistance[i],
          negativeDistance[i]
        ),
      });
    }

    return relativeCloseness;
    // 6. Rank results
    // return this.candidates.sort((a, b) => {
    // return relativeCloseness[b] - relativeCloseness[a];
    // });
  }
}

function zenith(matrix: number[][], benefitMatrix: number[]): number[] {
  console.log(`---Zenith: `);
  print2x2Matrix(matrix);
  console.log(`** ${benefitMatrix}`);

  const numRows = matrix.length;
  const numColumns = matrix[0].length;
  if (numColumns !== benefitMatrix.length)
    throw new Error("Must have same number of benefits and decision criteria.");

  benefitMatrix.forEach((val) => {
    if (Math.abs(val) !== 1)
      throw new Error("Benefit Matrix can only include values 1 or -1.");
  });

  const temp: number[] = [];
  for (let j = 0; j < numColumns; j++) {
    const col = new Array(numRows);
    for (let i = 0; i < numRows; i++) {
      col[i] = matrix[i][j];
    }
    console.log(`Column ${j}: ${col}`);
    if (benefitMatrix[j] > 0) {
      const val = Math.max(...col);
      console.log(`Best value: ${val}`);
      temp.push(val);
    } else {
      const val = Math.min(...col);
      console.log(`Best value: ${val}`);
      temp.push(val);
    }
  }
  return temp;
}

function nadir(matrix: number[][], benefitMatrix: number[]): number[] {
  console.log(`---Nadir: `);
  print2x2Matrix(matrix);
  console.log(`** ${benefitMatrix}`);

  const numRows = matrix.length;
  const numColumns = matrix[0].length;
  if (numColumns !== benefitMatrix.length)
    throw new Error("Must have same number of benefits and decision criteria.");

  benefitMatrix.forEach((val) => {
    if (Math.abs(val) !== 1)
      throw new Error("Benefit Matrix can only include values 1 or -1.");
  });

  const temp: number[] = [];
  for (let j = 0; j < numColumns; j++) {
    const col = new Array(numRows);
    for (let i = 0; i < numRows; i++) {
      col[i] = matrix[i][j];
    }
    console.log(`Column ${j}: ${col}`);
    if (benefitMatrix[j] > 0) {
      const val = Math.min(...col);
      console.log(`Worst value: ${val}`);
      temp.push(val);
    } else {
      const val = Math.max(...col);
      console.log(`Worst value: ${val}`);
      temp.push(val);
    }
  }
  console.log(`Nadir: ${temp}`);
  return temp;
}

function calculateRelativeCloseness(
  positive_distance: number,
  negative_distance: number
) {
  return negative_distance / (positive_distance + negative_distance);
}

/**
 *
 * @param decisionMatrix CPU_pct | cores | clockrate_GHz | BW | BW_utilization | RAM_GB | RTT_ms
 * @param benefitMatrix 1 for beneficial, -1 for disadvantegeous
 * @param weightMatrix Optional weights
 * @returns Unsorted Array of relative closeness for each row of decision matrix
 */
function topsis(
  decisionMatrix: number[][],
  benefitMatrix: number[],
  weightMatrix?: number[]
) {
  const numRows = decisionMatrix.length;
  // 1. Normalize decision Matrix
  const normalized = normalize(decisionMatrix);

  // 2. Calculate weighted normalized Matrix
  let weighted_normalized;
  if (weightMatrix) {
    weighted_normalized = weight(decisionMatrix, weightMatrix);
  } else {
    weighted_normalized = normalized;
  }

  // 3. Determin positive and negative ideal solutions
  const positive_ideal = zenith(weighted_normalized, benefitMatrix);
  const negative_ideal = nadir(weighted_normalized, benefitMatrix);

  // 4. Calculate separation measures
  const positive_distances = [];
  const negative_distances = [];
  for (let i = 0; i < numRows; i++) {
    positive_distances.push(
      euclidianDistance(decisionMatrix[i], positive_ideal)
    );
    negative_distances.push(
      euclidianDistance(decisionMatrix[i], negative_ideal)
    );
  }
  // 5. Calculate relative closeness
  const relative_closeness: number[] = [];
  for (let i = 0; i < numRows; i++) {
    relative_closeness.push(
      calculateRelativeCloseness(positive_distances[i], negative_distances[i])
    );
  }

  return relative_closeness;
}

export { zenith, nadir, topsis };
