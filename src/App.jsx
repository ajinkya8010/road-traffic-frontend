import HomePage from "./routes/homePage/homePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout, RequireAuth } from "./routes/layout/layout";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import Pothole from "./routes/pothole/pothole";
import Complaint from "./routes/complaint/complaint";
import Analysis from "./routes/analysis/analysis";
import Redeem from "./routes/redeem/redeem";
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/register",
          element: <Register />,
        }
      ]
    },
    {
      path:"/",
      element:<RequireAuth/>,
      children:[
        {
          path: "/pothole",
          element: <Pothole />,
        },
        {
          path: "/complaint",
          element: <Complaint />,
        },
        {
          path:"/analysis",
          element:<Analysis/>
        },
        {
          path:"/redeem",
          element:<Redeem/>
        },
      ]
    }
  ]);

  return <RouterProvider router={router} />;
}

export default App;
