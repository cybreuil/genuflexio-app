import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../Loader/Loader";

const AdminRoute = () => {
	const { user, isAdmin, isAuthLoading } = useAuth();

	if (isAuthLoading) {
		return <Loader size={56} />;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (!isAdmin) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
};

export { AdminRoute };
