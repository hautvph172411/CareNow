import axios from "./axios";

export const loginAdmin = (data) => {
  return axios.post("/users/login", data);
};

