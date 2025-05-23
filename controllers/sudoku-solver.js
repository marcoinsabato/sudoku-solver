class Cell {
  constructor(index) {
    this.index = index;

    const rowStart = Math.floor(index / 9);
    const columnStart = index % 9;

    this.rowIndices = Array.from({ length: 9 }, (_, i) => rowStart * 9 + i);
    this.columnIndices = Array.from({ length: 9 }, (_, i) => columnStart + i * 9);

    const regionStart = Math.floor(rowStart / 3) * 27 + Math.floor(columnStart / 3) * 3;
    this.regionIndices = Array.from({ length: 9 }, (_, i) =>
      regionStart + Math.floor(i / 3) * 9 + i % 3
    );

    const adjacentRowStart = 3 * Math.floor(rowStart / 3);
    const nextRow1 = 9 * (adjacentRowStart + (rowStart + 1) % 3);
    const nextRow2 = 9 * (adjacentRowStart + (rowStart + 2) % 3);
    this.adjacentRegionRowIndices = [
      ...Array.from({ length: 9 }, (_, i) => nextRow1 + i),
      ...Array.from({ length: 9 }, (_, i) => nextRow2 + i),
    ];

    const adjacentColumnStart = 3 * Math.floor(columnStart / 3);
    const nextColumn1 = adjacentColumnStart + (columnStart + 1) % 3;
    const nextColumn2 = adjacentColumnStart + (columnStart + 2) % 3;
    this.adjacentRegionColumnIndices = [
      ...Array.from({ length: 9 }, (_, i) => nextColumn1 + i * 9),
      ...Array.from({ length: 9 }, (_, i) => nextColumn2 + i * 9),
    ];
  }
}

// Class that generates all the cell values for all 80 cells.
class Indexer {
  constructor() {
    this.lookup = {};
    for (let i=0; i<81; i++) {
       this.lookup[i] = new Cell(i);
    }
  }
}

// Lookup for the row values to numbers [0-8].
let rowLookup = {
  "A":0, "B":1, "C":2, 
  "D":3, "E":4, "F":5, 
  "G":6, "H":7, "I":8,
  "a":0, "b":1, "c":2,
  "d":3, "e":4, "f":5, 
  "g":6, "h":7, "i":8
}

// Lookup for the column values to numbers [0-8].
let colLookup = (col) => {return col-1}

// Maps the cell coordinates to a cell index [0-80].
let cellIdxMap = (row, col) => {
  return 9*rowLookup[row] + colLookup(col)
}

// Returns the substring of the puzzle that represents the rows.
let rowString = (puzzleString, cellIdx) => {
  return indexer.lookup[cellIdx].rowIdxs.map(x=>puzzleString[x]).join();
}

// Returns the substring of the puzzle that represents the columns.
let colString = (puzzleString, cellIdx) => {
  return indexer.lookup[cellIdx].colIdxs.map(x=>puzzleString[x]).join();
}

// Returns the substring of the puzzle that represents the region.
let regionString = (puzzleString, cellIdx) => {
  return indexer.lookup[cellIdx].regIdxs.map(x=>puzzleString[x]).join();
}

// Define the indexer to use in the Sudoku Solver.
let indexer = new Indexer();

class SudokuSolver {

  validate(puzzle) {
    for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
      if (puzzle[cellIndex] !== ".") {
        const value = puzzle[cellIndex];
        const temporaryPuzzle = [...puzzle];
        temporaryPuzzle[cellIndex] = ".";
        const puzzleString = temporaryPuzzle.join("");
        const row = rowString(puzzleString, cellIndex);
        const column = colString(puzzleString, cellIndex);
        const region = regionString(puzzleString, cellIndex);
        const regex = new RegExp(value, "g");
        if (regex.test(row + column + region)) {
          return false;
        }
      }
    }
    return true;
  }

  // Checks if a value already exists at the given coordinate.
  checkValueExists(puzzleString, row, column, value) {
    const cellIndex = cellIdxMap(row, column);
    return puzzleString[cellIndex] === value;
  }
  // Check if a value does not violate the row rule.
  checkRowPlacement(puzzleString, rowIndex, columnIndex, value) {
    const cellIndex = cellIdxMap(rowIndex, columnIndex);
    const rowString = rowString(puzzleString, cellIndex);

    return !new RegExp(value, "g").test(rowString);
  }
  // Check proposed value does not violate the sudoku column rule.
  checkColPlacement(puzzleString, row, column, value) {
    // Map the coordinates to the cell index.
    let cellIdx = cellIdxMap(row,column);
    // Get the puzzle substring that represents the cell's column.
    let cString = colString(puzzleString, cellIdx);
    // Regex to check for the value in the column.
    let re = new RegExp(value, "g");
    return !re.test(cString);
  }
  // Check proposed value does not violate the sudoku region rule.
  checkRegionPlacement(puzzleString, row, column, value) {
    // Map the coordinates to the cell index.
    let cellIdx = cellIdxMap(row,column);
    // Get the puzzle substring that represents the cell's region.
    let reString = regionString(puzzleString, cellIdx);
    // Regex to check for the value in the region.
    let re = new RegExp(value, "g");
    return !re.test(reString);
  }
  // Finds the values for a cell that do not violate the row, column and region rules of sudoku. Takes the coordinate.
  findAllCellOptions(puzzleString, row, column ) {
    // Map the coordinates to the cell index.
    let cellIdx = cellIdxMap(row,column);
    return this.findAllCellOptionsByCellInd(puzzleString, cellIdx);
  }

  //Finds the values for a cell that do not violate the row, column and region rules of sudoku. Takes the cell index.
  findAllCellOptionsByCellInd(puzzleString, cellIdx) {
    // Get the puzzle substring that represents the cell's row.
    let rString = rowString(puzzleString, cellIdx);
    // Get the puzzle substring that represents the cell's column.
    let cString = colString(puzzleString, cellIdx);
    // Get the puzzle substring that represents the cell's region.
    let reString = regionString(puzzleString, cellIdx);
    // Regex of all the characters not in the rows, columns and regions.
    let re = new RegExp("[^"+rString+cString+reString+"]", "g");
    // Match with all possible values [1-9] and returns an array of the missing entries.
    return ("123456789").match(re);
  }

  // A brute force algorithm.
  solve(puzzle) {
    // Loop over the indices.
    for (let cellIdx=0; cellIdx<81; cellIdx++ ){
      // If the puzzles cell is not set.
      if (puzzle[cellIdx] == ".") {
        // Make the puzzle a string for matching.
        let pString = puzzle.join("");
        // Loop over all the possible cell options.
        for (let k=1; k<10; k++ ){
          // Get the puzzle substring that represents the cell's row.
          let rString = rowString(pString, cellIdx);
          // Get the puzzle substring that represents the cell's column.
          let cString = colString(pString, cellIdx);
          // Get the puzzle substring that represents the cell's region.
          let reString = regionString(pString, cellIdx);
          // Test the guessed value to see if it violates the row, column and region rules of sudoku.
          let re = new RegExp(k, "g");
          if (!re.test(rString+cString+reString)) {
            // Set the puzzle value.
            puzzle[cellIdx] = k;
            // Now solve the new puzzle.
            if(this.solve(puzzle)) {
              // Signals the sub puzzles found the solution.
              return true;
            }
          }
          puzzle[cellIdx] = ".";
        }
        // If all possible guesses for this cell (along with its sub puzzles) did not work, return false.
        return false;
      }
    }
    // Signals the sub puzzles found the solution.
    return true;
  }
}

module.exports = SudokuSolver;