import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Define the progress state
interface ProgressState {
    solvedProblems: string[];
    attemptedProblems: string[];
    savedCode: Record<string, string>;
}

// Check local storage for initial state to persist progress across refreshes
const loadState = (): ProgressState => {
    try {
        const serializedState = localStorage.getItem('codesync-progress');
        if (serializedState === null) {
            return { solvedProblems: [], attemptedProblems: [], savedCode: {} };
        }
        const state = JSON.parse(serializedState);
        return {
            ...state,
            savedCode: state.savedCode || {}
        };
    } catch (err) {
        return { solvedProblems: [], attemptedProblems: [], savedCode: {} };
    }
};

const initialState: ProgressState = loadState();

export const progressSlice = createSlice({
    name: 'progress',
    initialState,
    reducers: {
        markProblemAttempted: (state, action: PayloadAction<string>) => {
            if (!state.attemptedProblems.includes(action.payload)) {
                state.attemptedProblems.push(action.payload);
                // Save to local storage
                localStorage.setItem('codesync-progress', JSON.stringify(state));
            }
        },
        markProblemSolved: (state, action: PayloadAction<string>) => {
            if (!state.solvedProblems.includes(action.payload)) {
                state.solvedProblems.push(action.payload);
            }
            if (!state.attemptedProblems.includes(action.payload)) {
                state.attemptedProblems.push(action.payload);
            }
            // Save to local storage
            localStorage.setItem('codesync-progress', JSON.stringify(state));
        },
        saveProblemCode: (state, action: PayloadAction<{ problemId: string, code: string }>) => {
            state.savedCode[action.payload.problemId] = action.payload.code;
            // Save to local storage
            localStorage.setItem('codesync-progress', JSON.stringify(state));
        }
    },
});

export const { markProblemAttempted, markProblemSolved, saveProblemCode } = progressSlice.actions;

export const store = configureStore({
    reducer: {
        progress: progressSlice.reducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
