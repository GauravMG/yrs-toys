import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onUnauthorized } from "../lib/auth-events";
import { useToast } from "@yrs/ui";

/** Mounted once inside <BrowserRouter>: sends the admin to /login the moment lib/api-client.ts gives up on refreshing an expired session. */
export function SessionListener() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    return onUnauthorized(() => {
      showToast("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    });
  }, [navigate, showToast]);

  return null;
}
