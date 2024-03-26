import Container from "react-bootstrap/Container";
import Car from "../components/Car";
import { useLocation } from "react-router-dom";
import Row from "react-bootstrap/Row";
import Loading from "../components/Loading";
import FetchBaseError from "../components/FetchBaseError";
import { useGetAllCarsAdminPriviledgeQuery } from "../features/cars/carsApiSlice";

/**
 *
 * @returns Admin page, which displays all the car notes data available to an admin.
 */
function HomeAdmin() {
  // use the `useLocation()` hook
  const location = useLocation();

  // use the `useGetAllCarsAdminPriviledgeQuery()` to get the cars.
  // This query will run / the data will refetch, whenever the query parameters in the url change.
  const {
    data: cars,
    isLoading,
    error,
  } = useGetAllCarsAdminPriviledgeQuery(location.search);

  // If there are cars,
  // show 1 car in a row on extra small screens and above.
  // show 2 cars in a row on medium screens and above.
  // show 3 cars in a row on large screens and above.
  return (
    <Container>
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

export default HomeAdmin;
