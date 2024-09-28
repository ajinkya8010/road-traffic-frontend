import "./register.scss";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="registerPage">
      <div className="formContainer">
        <form>
          <h1>Create an Account</h1>
          <input name="username" type="text" placeholder="Username" />
          <input name="email" type="text" placeholder="Email" />
          <input name="password" type="password" placeholder="Password" />
          <input name="phone" type="tel" placeholder="Phone-number" pattern="[0-9]{10}" />
          <button >Register</button>
          <Link to="/login">Do you have an account?</Link>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="Logo" />
      </div>
    </div>
  );
}

export default Register;
