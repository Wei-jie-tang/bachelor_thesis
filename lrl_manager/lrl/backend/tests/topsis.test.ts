import { beforeEach, describe, expect, test } from "@jest/globals";
import { normalize, vectorSum, weight } from "../src/common/utils";
import { zenith, nadir, TOPSIS } from "../src/procedures/topsis";

describe("normalize funcion", () => {
  test("normalizes a 2x2 matrix", () => {
    const matrix = [
      [1, 2],
      [3, 4],
    ];
    const normalized_expected = [
      [0.316, 0.447],
      [0.949, 0.894],
    ];
    const normalized = normalize(matrix);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        expect(normalized[i][j]).toBeCloseTo(normalized_expected[i][j]);
      }
    }
  });
});

describe("weight function", () => {
  const matrix = [
    [1, 2, 3],
    [4, 5, 6],
  ];

  test("throws if not enough weighs", () => {
    const weights = [0.8, 0.2];

    expect(() => {
      weight(matrix, weights);
    }).toThrow();
  });

  test("throws if too many weights", () => {
    const weights = [0.2, 0.2, 0.2, 0.2, 0.2];

    expect(() => {
      weight(matrix, weights);
    }).toThrow();
  });

  test("weights a 3x2 matrix", () => {
    const weights = [0.1, 0.2, 0.7];

    const weighted_expected = [
      [0.1, 0.4, 2.1],
      [0.4, 1, 4.2],
    ];
    const weighted = weight(matrix, weights);

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        expect(weighted[i][j]).toBeCloseTo(weighted_expected[i][j]);
      }
    }
  });
});

describe("zenith funcion", () => {
  const matrix = [
    [23, 2, 34],
    [1, 3, 6],
    [6, 3, 5],
  ];
  test("throws, if benefit vector has too many values", () => {
    const benefits = [-1, 1, 1, 1];

    expect(() => {
      zenith(matrix, benefits);
    }).toThrow();
  });

  test("throws, if benefit vector has not enough values", () => {
    const benefits = [-1, 1];

    expect(() => {
      zenith(matrix, benefits);
    }).toThrow();
  });

  test("throws, if benefit vector has values different from 1, -1", () => {
    const benefits = [-1, 0, 1];

    expect(() => {
      zenith(matrix, benefits);
    }).toThrow();
  });

  test("finds 3x3 positive ideal solution matrix", () => {
    const benefits = [1, 1, -1];
    const zenith_expected = [23, 3, 5];

    const zenith_actual = zenith(matrix, benefits);

    for (let i = 0; i < 3; i++) {
      expect(zenith_actual[i]).toBe(zenith_expected[i]);
    }
  });
});

describe("nadir funcion", () => {
  const matrix = [
    [23, 2, 34],
    [1, 3, 6],
    [6, 3, 5],
  ];
  test("throws, if benefit vector has too many values", () => {
    const benefits = [-1, 1, 1, 1];

    expect(() => {
      nadir(matrix, benefits);
    }).toThrow();
  });

  test("throws, if benefit vector has not enough values", () => {
    const benefits = [-1, 1];

    expect(() => {
      nadir(matrix, benefits);
    }).toThrow();
  });

  test("throws, if benefit vector has values different from 1, -1", () => {
    const benefits = [-1, 0, 1];

    expect(() => {
      nadir(matrix, benefits);
    }).toThrow();
  });

  test("finds 3x3 negative ideal solution matrix", () => {
    const benefits = [1, 1, -1];
    const nadir_expected = [1, 2, 34];

    const nadir_actual = nadir(matrix, benefits);

    for (let i = 0; i < 3; i++) {
      expect(nadir_actual[i]).toBe(nadir_expected[i]);
    }
  });
});

describe("TOPSIS class", () => {
  const candidates = [
    {
      ID: "A",
      resources: {
        RAM: 4,
        Memory: 128,
        DisplaySize: 6.5,
        Battery: 3500,
        Price: 15000,
      },
    },
    {
      ID: "B",
      resources: {
        RAM: 6,
        Memory: 64,
        DisplaySize: 6.4,
        Battery: 3800,
        Price: 16000,
      },
    },
    {
      ID: "C",
      resources: {
        RAM: 6,
        Memory: 128,
        DisplaySize: 6.8,
        Battery: 4200,
        Price: 19000,
      },
    },
    {
      ID: "D",
      resources: {
        RAM: 8,
        Memory: 256,
        DisplaySize: 7,
        Battery: 5000,
        Price: 25000,
      },
    },
    {
      ID: "E",
      resources: {
        RAM: 3,
        Memory: 64,
        DisplaySize: 6.2,
        Battery: 4000,
        Price: 14000,
      },
    },
  ];

  const weights = {
    RAM: 0.5,
    Memory: 1.5,
    DisplaySize: 1.5,
    Battery: 2,
    Price: 2.5,
  };

  describe("TOPSIS", () => {
    let topsis;
    beforeEach(() => {
      topsis = new TOPSIS({
        RAM: 1,
        Memory: 1,
        DisplaySize: 1,
        Battery: 1,
        Price: -1,
      });
    });

    describe("Object Methods", () => {
      test("addCandidate()", () => {
        topsis.addCandidate(candidates[0].ID, candidates[0].resources);
        topsis.addCandidate(candidates[1].ID, candidates[1].resources);

        expect(topsis.candidates).toHaveLength(2);

        const ID0_result = topsis.candidates[0];
        const ID1_result = topsis.candidates[1];
        const decisionMatrix_result = topsis.decisionMatrix;

        const ID0_expected = "A";
        const ID1_expected = "B";
        const resources0_expected = [4, 128, 6.5, 3500, 15000];
        const resources1_expected = [6, 64, 6.4, 3800, 16000];

        expect(ID0_result).toBe[ID0_expected];
        expect(ID1_result).toBe[ID1_expected];

        expect(decisionMatrix_result).toHaveLength(2);
        expect(decisionMatrix_result[0]).toEqual(
          expect.arrayContaining(resources0_expected)
        );
        expect(decisionMatrix_result[1]).toEqual(
          expect.arrayContaining(resources1_expected)
        );
      });

      test("addWeights", () => {
        topsis.addWeights(weights);

        const weightMatrix_result = topsis.weightMatrix;

        const weightMatrix_expected = [0.5, 1.5, 1.5, 2, 2.5];

        expect(weightMatrix_result).toEqual(
          expect.arrayContaining(weightMatrix_expected)
        );
      });
    });

    describe("Ranking function", () => {
      beforeEach(() => {
        candidates.forEach((candidate) => {
          topsis.addCandidate(candidate.ID, candidate.resources);
        });
      });

      test("Unweighted Ranking", () => {
        const ranking_result = topsis.getRanking();
        const ranking_expected = {
          A: 0.38,
          B: 0.34,
          C: 0.44,
          D: 0.73,
          E: 0.28,
        };
        expect(ranking_result["A"]).toBeCloseTo(ranking_expected["A"]);
        expect(ranking_result["B"]).toBeCloseTo(ranking_expected["B"]);
        expect(ranking_result["C"]).toBeCloseTo(ranking_expected["C"]);
        expect(ranking_result["D"]).toBeCloseTo(ranking_expected["D"]);
        expect(ranking_result["E"]).toBeCloseTo(ranking_expected["E"]);
      });

      test("Weighted Ranking", () => {
        topsis.addWeights(weights);
        const ranking_result = topsis.getRanking();
        const ranking_expected = {
          A: 0.5,
          B: 0.38,
          C: 0.43,
          D: 0.59,
          E: 0.42,
        };
        expect(ranking_result["A"]).toBeCloseTo(ranking_expected["A"]);
        expect(ranking_result["B"]).toBeCloseTo(ranking_expected["B"]);
        expect(ranking_result["C"]).toBeCloseTo(ranking_expected["C"]);
        expect(ranking_result["D"]).toBeCloseTo(ranking_expected["D"]);
        expect(ranking_result["E"]).toBeCloseTo(ranking_expected["E"]);
      });
    });
  });
});
