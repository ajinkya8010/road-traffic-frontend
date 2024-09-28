import "./login.scss";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login">
      <div className="formContainer">
        <form>
          <h1>Welcome back</h1>
          <input
            name="username"
            required
            minLength={3}
            maxLength={20}
            type="text"
            placeholder="Username"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
          />
          <button>Login</button>
          <Link to="/register">Not having an account?</Link>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="Logo" />
      </div>
    </div>
  );
}

export default Login;
