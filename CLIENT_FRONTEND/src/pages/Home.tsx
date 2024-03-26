import Container from "react-bootstrap/Container";
import Car from "../components/Car";
import { useAppSelector } from "../app/hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Row from "react-bootstrap/Row";
import Loading from "../components/Loading";
import FetchBaseError from "../components/FetchBaseError";
import { useGetAllCarsQuery } from "../features/cars/carsApiSlice";

/**
 *
 * @returns A page which dispays all the car notes created by the current user.
 */
function Home() {
  // use the `useNavige()` hook the redirect a user to a particular page
  const navigate = useNavigate();

  // use the `useLocation()` hook
  const location = useLocation();

  // get the current user from global state
  const currentUser = useAppSelector((state) => state.auth.user);

  // use the `useGetAllCarsQuery()` to get the cars.
  // This query will run / the data will refetch, whenever the query parameters in the url change.
  const { data: cars, isLoading, error } = useGetAllCarsQuery(location.search);

  // needed with react 18 (useEffect runs twice in dev mode with strict mode)
  const effectRan = useRef(false);

  // When the component mounts(/loads), check if the user is an admin. If yes, redirect to admin page.
  useEffect(() => {
    if (effectRan.current === false) {
      if (currentUser && currentUser.roles.includes("admin")) {
        navigate("/admin");
      }
      return () => {
        effectRan.current = true;
      };
    }
  }, []);

  // If there are cars,
  // show 1 car in a row on extra small screens and above.
  // show 2 cars in a row on medium screens and above.
  // show 3 cars in a row on large screens and above.
  return (
    <Container>
      {/* column takes 12 places of the screen (i.e. 100% of the screen) on extreme small screen sizes and above */}
      {/* column takes 8 places of the screen  on small screen sizes and above */}
      {error ? (
        <FetchBaseError error={error} />
      ) : isLoading ? (
        <Loading />
      ) : cars && cars.length > 0 ? (
        <Row xs={1} md={2} lg={3}>
          {cars.map((car) => (
            <Car key={car.carId} car={car} />
          ))}
        </Row>
      ) : (
        <p className="my-3">No car notes.</p>
      )}
    </Container>
  );
}

export default Home;
