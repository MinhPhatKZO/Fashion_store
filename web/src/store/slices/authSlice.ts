import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id?: string;
  name: string;
  role: "admin" | "user" | "seller";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setToken, logout } = authSlice.actions;

// ✅ Khởi tạo Redux state từ localStorage
export const initializeAuth = () => (dispatch: any) => {
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");
  const userRole = localStorage.getItem("userRole");
  const userID = localStorage.getItem("userID");

  if (token && userName && userRole) {
    dispatch(
      setUser({
        id: userID || undefined,
        name: userName,
        role: userRole as "admin" | "user" | "seller",
      })
    );
    dispatch(setToken(token));
  }
};

export default authSlice.reducer;
