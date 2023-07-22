import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { Solution } from '~/domain/entities'
import { BoxKinds, type BoxSchema } from '~/domain/models'

import { BoardService } from './board.service'
import { SelectionService } from './selection.service'

const solution = new Solution()

describe('Sudoku Board', () => {
	let board: BoardService, selection: SelectionService
	const standardBox: BoxSchema = {
		notes: [],
		kind: BoxKinds.Empty,
		value: BoardService.EMPTY_BOX_VALUE,
	}
	beforeAll(() => {
		vi.useFakeTimers()
		return () => vi.useRealTimers()
	})

	beforeEach(() => {
		selection = new SelectionService()
		board = new BoardService({ selectionService: selection })
		board.initBoard({ solution })
		vi.advanceTimersByTime(0)
	})

	test('Not all box should be initials', () => {
		const everyIsInitial = board
			.getBoard()
			.every(col => col.every(box => box.kind === BoxKinds.Initial))
		expect(everyIsInitial).toBe(false)
	})

	describe('Write Number', () => {
		test('Should change the status to incorrect', () => {
			const initialBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Initial)!
			const correctValue = board.getSudokuValue(initialBoxPos)
			const incorrectValue = correctValue > 9 ? 1 : correctValue + 1

			selection.moveTo(initialBoxPos)
			board.writeNumber(incorrectValue)

			const box = board.getBox(initialBoxPos)
			expect(box).toMatchObject<BoxSchema>({
				...standardBox,
				kind: BoxKinds.Initial,
				value: correctValue,
			})
		})
		test('Should change the status to incorrect', () => {
			const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!
			const correctValue = board.getSudokuValue(voidBoxPos)
			const incorrectValue = correctValue > 9 ? 1 : correctValue + 1

			selection.moveTo(voidBoxPos)
			board.writeNumber(incorrectValue)

			const box = board.getBox(voidBoxPos)
			expect(box).toMatchObject<BoxSchema>({
				...standardBox,
				kind: BoxKinds.Incorrect,
				value: incorrectValue,
			})
		})
		test('Should change the status to correct', () => {
			const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!
			const correctValue = board.getSudokuValue(voidBoxPos)

			selection.moveTo(voidBoxPos)
			board.writeNumber(correctValue)

			const box = board.getBox(voidBoxPos)
			expect(box).toMatchObject<BoxSchema>({
				...standardBox,
				kind: BoxKinds.Correct,
				value: correctValue,
			})
		})
		test('should reset notes', () => {
			const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!
			const correctValue = board.getSudokuValue(voidBoxPos)

			selection.moveTo(voidBoxPos)
			board.addNote(1)
			board.writeNumber(correctValue)

			const box = board.getBox(voidBoxPos)
			expect(box).toMatchObject<BoxSchema>({
				...standardBox,
				kind: BoxKinds.Correct,
				value: correctValue,
			})
		})
	})

	describe('Add Notes', () => {
		test('Should change the status to notes', () => {
			const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!

			selection.moveTo(voidBoxPos)
			board.addNote(1)

			const box = board.getBox(voidBoxPos)
			expect(box).toMatchObject<BoxSchema>({
				...standardBox,
				kind: BoxKinds.WhitNotes,
				notes: [1],
			})
		})
	})
	test('should arrange the notes correctly', () => {
		const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!

		selection.moveTo(voidBoxPos)
		board.addNote(3)
		board.addNote(9)
		board.addNote(1)
		board.addNote(2)

		const box = board.getBox(voidBoxPos)
		expect(box).toMatchObject<BoxSchema>({
			...standardBox,
			kind: BoxKinds.WhitNotes,
			notes: [1, 2, 3, 9],
		})
	})
	test('should not repeat notes', () => {
		const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!

		selection.moveTo(voidBoxPos)
		board.addNote(1)
		board.addNote(1)

		const box = board.getBox(voidBoxPos)
		expect(box).toMatchObject<BoxSchema>({
			...standardBox,
			kind: BoxKinds.WhitNotes,
			notes: [1],
		})
	})
	test('should reset value', () => {
		const voidBoxPos = BoardService.getFirstBoxWithKind(board.getBoard(), BoxKinds.Empty)!

		selection.moveTo(voidBoxPos)
		board.writeNumber(9)
		board.addNote(1)
		board.addNote(1)

		const box = board.getBox(voidBoxPos)
		expect(box).toMatchObject<BoxSchema>({
			...standardBox,
			kind: BoxKinds.WhitNotes,
			notes: [1],
		})
	})
})
