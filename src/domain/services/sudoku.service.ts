import {
	BoxStates,
	type BoxSchema,
	type ISudokuService,
	Difficulties,
	type Position,
} from '../models'
import {
	addNewNote,
	probabilityToBeInitial,
	createArrayMap,
	createEmptyBoard,
	randomNumbers,
	isSafe,
} from '../utils'

export class SudokuService implements ISudokuService {
	static createSolution() {
		const board = createEmptyBoard()

		function fillDiagonal() {
			for (let i = 0; i < 9; i += 3) {
				fillBox(i, i)
			}
		}

		function fillBox(row: number, col: number) {
			const numbers = randomNumbers()

			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					board[row + i][col + j] = numbers[i * 3 + j]
				}
			}
		}

		function fillRemaining(row: number, col: number): boolean {
			if (col >= 9 && row < 9 - 1) {
				row = row + 1
				col = 0
			}

			if (row >= 9 && col >= 9) {
				return true
			}

			if (row < 3) {
				if (col < 3) {
					col = 3
				}
			} else if (row < 9 - 3) {
				if (col === Math.floor(row / 3) * 3) {
					col = col + 3
				}
			} else {
				if (col === 9 - 3) {
					row = row + 1
					col = 0
					if (row >= 9) {
						return true
					}
				}
			}

			for (let num = 1; num <= 9; num++) {
				if (isSafe({ row, col, num }, board)) {
					board[row][col] = num
					if (fillRemaining(row, col + 1)) {
						return true
					}
					board[row][col] = 0
				}
			}

			return false
		}

		fillDiagonal()
		fillRemaining(0, 3)

		return board
	}
	static EMPTY_BOX_VALUE = 0
	static getSectors(sudoku: readonly number[][]) {
		const quadrants = createArrayMap(9, () => new Set<number>())
		const cols = createArrayMap(9, () => new Set<number>())
		const rows = createArrayMap(9, () => new Set<number>())
		for (let col = 0; col < 9; col++) {
			for (let row = 0; row < 9; row++) {
				const quadrant = Math.trunc(row / 3) + Math.trunc(col / 3) * 3
				cols[col].add(sudoku[col][row])
				rows[row].add(sudoku[col][row])
				quadrants[quadrant].add(sudoku[col][row])
			}
		}
		return { quadrants, cols, rows }
	}
	static isWin(board: readonly BoxSchema[][]) {
		return board.every(cols =>
			cols.every(box => [BoxStates.Initial, BoxStates.Correct].includes(box.state))
		)
	}
	static getFirstBoxWithState(board: readonly BoxSchema[][], state: BoxStates) {
		for (let row = 0; row < board.length; row++) {
			for (let col = 0; col < board[row].length; col++) {
				if (board[row][col].state === state) return { col, row }
			}
		}
	}

	#board: BoxSchema[][]
	#difficulty: Difficulties
	#sudoku: readonly number[][]

	constructor({
		sudoku = SudokuService.createSolution(),
		difficulty = Difficulties.Basic,
	}: {
		sudoku?: readonly number[][]
		difficulty?: Difficulties
	} = {}) {
		this.#sudoku = sudoku
		this.#difficulty = difficulty
		this.#board = this.#createBoard()
	}

	#createBoard() {
		const board: BoxSchema[][] = []
		for (let row = 0; row < 9; row++) {
			board[row] = []
			for (let col = 0; col < 9; col++) {
				const isInitial = probabilityToBeInitial(this.#difficulty)
				board[row][col] = {
					notes: [],
					selected: false,
					state: isInitial ? BoxStates.Initial : BoxStates.Empty,
					value: isInitial ? this.#sudoku[row][col] : SudokuService.EMPTY_BOX_VALUE,
				}
			}
		}
		return board
	}
	#boardMap(mapFn: (args: { box: BoxSchema } & Position) => BoxSchema) {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				this.#board[row][col] = mapFn({ box: this.getBox({ col, row }), col, row })
			}
		}
	}
	#updateSelected(update: (args: { box: BoxSchema } & Position) => BoxSchema) {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				const box = this.getBox({ col, row })
				if (box.selected && box.state !== BoxStates.Initial)
					this.#board[row][col] = update({ box, col, row })
			}
		}
	}

	addNote(value: number) {
		this.#updateSelected(({ box }) => ({
			...box,
			value: SudokuService.EMPTY_BOX_VALUE,
			notes: addNewNote(box.notes, value),
			state: BoxStates.WhitNotes,
		}))
	}
	getBoard = (): readonly BoxSchema[][] => this.#board
	getBox = ({ col, row }: Position) => Object.freeze(this.#board[row][col])
	getSudokuValue = ({ col, row }: Position) => this.#sudoku[row][col]
	moveSelected(pos: Position) {
		this.#boardMap(({ box, col, row }) => ({
			...box,
			selected: pos.col === col && pos.row === row,
		}))
	}
	writeNumber(value: number) {
		this.#updateSelected(({ box, ...pos }) => {
			const isCorrect = this.getSudokuValue(pos) === value
			return {
				...box,
				notes: [],
				value: value,
				state: isCorrect ? BoxStates.Correct : BoxStates.Incorrect,
			}
		})
	}
}
