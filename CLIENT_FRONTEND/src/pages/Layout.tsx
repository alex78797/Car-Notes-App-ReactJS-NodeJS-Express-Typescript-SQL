import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { removeCredentials } from "../features/auth/authSlice";
import { useDispatch } from "react-redux";
import { apiSlice } from "../app/api/apiSlice";
import { useLogoutUserMutation } from "../features/auth/authApiSlice";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Button, Offcanvas } from "react-bootstrap";
import { useState } from "react";
import FilterCheckboxes from "../components/FilterCheckboxes";
import FetchBaseError from "../components/FetchBaseError";

/**
 *
 * @returns A page (/component), which renders the layout of the application: the navbar, and the pages rendered under the navbar (the outlet).
 * The <Outlet /> component renders the child route's element, if there is one. (The routes and their children are defined in App.tsx).
 */
function Layout() {
  // get the current user from the global state
  const currentUser = useAppSelector((state) => state.auth.user);

  // use `useDispatch()` hook to send data to the global state
  const dispatch = useDispatch();

  // use the `useLogoutUserMutation()` hook in order to make the POST request to logout the user
  const [logout, { error }] = useLogoutUserMutation();

  // use hte `useNavigate` hook to navigate to a particular page
  const navigate = useNavigate();

  // show / hide offcanvas
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  function handleCloseOffcanvas() {
    setShowOffcanvas(false);
  }

  function handleShowOffcanvas() {
    setShowOffcanvas(true);
  }

  /**
   * When the user clicks the `Log Out` button/text, it triggersthis method, which
   * first prevents the default browser behaviour the refresh the page,
   * then makes a POST request to log out.
   *
   * Finally it removes all credentials from state (user and access token) and clears the previous state of the user.
   *
   * It then redirectes automatically to the login page. (If not, it should be done `manually` with react-router-dom.)
   */
  async function handleLogout(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();
    await logout().unwrap();
    dispatch(removeCredentials());
    dispatch(apiSlice.util.resetApiState());
    // navigate("/login")
  }

  /**
   * When the user clicks the button to reset the password, it triggers this method
   * which first prevents the default browser behaviour to refresh the page
   * and then redirects the user to the reset password page.
   * @param e
   */
  function handleNavigateToResetPasswordPage(
    e: React.MouseEvent<HTMLElement, MouseEvent>
  ) {
    e.preventDefault();
    navigate("/resetPassword");
  }

  /**
   * When the user clicks the button to delete the account, it triggers this method
   * which first prevents the default browser behaviour to refresh the page
   * and then redirects the user to the delete account page.
   * @param e
   */
  function handleNavigateToDeleteAccountPage(
    e: React.MouseEvent<HTMLElement, MouseEvent>
  ) {
    e.preventDefault();
    navigate("/deleteAccount");
  }

  return (
    <>
      {currentUser && (
        <Navbar collapseOnSelect className="bg-body-tertiary" sticky="top">
          {/* Button to show / hide the offcanvas with checkboxes. */}
          {/* position: "absolute" places the filter button outside the container flow, */}
          {/* but causes overlapping with the container on smaller screens */}
          <Button
            style={{
              position: "absolute",
              backgroundColor: "transparent",
              border: "none",
              top: 10,
            }}
            onClick={handleShowOffcanvas}
          >
            <span className="navbar-toggler-icon"></span>
            {/* Filters */}
          </Button>

          {/* The offcanvas with the checkboxes */}
          {/* The checkboxes are used for filtering the car notes. */}
          <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas}>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Filters</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <FilterCheckboxes />
            </Offcanvas.Body>
          </Offcanvas>

          {/* the container in the navbar */}
          <Container>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {/* Hide this element on screens smaller than large */}
              {/* To avoid overlapping with the filters button */}
              <Navbar.Brand className="d-none d-lg-block">
                Welcome {currentUser.userName}
              </Navbar.Brand>
            </Link>

            <Navbar.Toggle aria-controls="responsive-navbar-nav" />

            <Nav className="me-auto"></Nav>

            <Nav>
              <Link
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                  display: "flex", // otherwise it is not centered vertically
                  marginRight: "20px", // to add more space to the text right of the link
                }}
                to="/addCar"
              >
                <Navbar.Text>Add Car </Navbar.Text>
              </Link>

              <NavDropdown
                title="Account Settings"
                id="navbarScrollingDropdown"
              >
                <NavDropdown.Item
                  onClick={handleLogout}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  Log Out
                </NavDropdown.Item>

                <NavDropdown.Item
                  onClick={handleNavigateToResetPasswordPage}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  Change Password
                </NavDropdown.Item>

                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleNavigateToDeleteAccountPage}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  Delete Account
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Container>
        </Navbar>
      )}

      {error && <FetchBaseError error={error} />}

      <Outlet />
    </>
  );
}

export default Layout;
