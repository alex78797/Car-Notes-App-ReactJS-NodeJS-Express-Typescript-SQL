import { useLocation } from "react-router-dom";
import EditCarForm from "../components/EditCarForm";
import Loading from "../components/Loading";
import FetchBaseError from "../components/FetchBaseError";
import { useGetCarQuery } from "../features/cars/carsApiSlice";

/**
 *
 * @returns A page, where the user can edit a car note.
 */
function EditCar() {
  const location = useLocation();
  // console.log(location)  // Object { pathname: "/edit/66d4ee1b-4fcf-4aa9-8155-0032394ab1ef", search: "", hash: "", state: null, key: "qwwx90kh" }

  const carId = location.pathname.split("/")[2];

  const { data: car, error, isLoading } = useGetCarQuery(carId);

  if (error) {
    return <FetchBaseError error={error} />;
  }

  if (isLoading || !car) {
    return <Loading />;
  }

  return <EditCarForm car={car} />;
}

export default EditCar;
