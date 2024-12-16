import HomePage from "./routes/homePage/homePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout, RequireAuth } from "./routes/layout/layout";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import Pothole from "./routes/pothole/pothole";
import Complaint from "./routes/complaint/complaint";
import Analysis from "./routes/analysis/analysis";
import Redeem from "./routes/redeem/redeem";
import Event from "./routes/event/event";
import AdminDashboard from "./routes/admin/adminDashboard";
import PotholeDisplay from "./routes/potholeDisplay/potholeDisplay";
import ComplaintDisplay from "./routes/complaintDisplay/complaintDisplay";
import UserDisplay from "./routes/userDisplay/userDisplay";
import RouteHistory from "./routes/routeHistory/routeHistory";

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
        {
          path:"/event",
          element:<Event/>
        },
        {
          path:"/route-history",
          element:<RouteHistory/>
        }
      ]
    },
    {
      path: "/admin",
      element: <RequireAuth requiredRole="admin" />, // Restrict this route to admins only
      children: [
        {
          path: "/admin",
          element: <AdminDashboard />,
        },
        {
          path: "/admin/potholes",
          element: <PotholeDisplay />,
        },
        {
          path: "/admin/complaints",
          element: <ComplaintDisplay />,
        },
        {
          path:"/admin/users",
          element: <UserDisplay/>
        }
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
