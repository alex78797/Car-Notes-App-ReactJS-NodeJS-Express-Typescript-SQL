import { ICar } from "../../types/types";
import { apiSlice } from "../../app/api/apiSlice";

// Define a service using a base URL and expected endpoints
export const carsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // The `getAllCars` endpoint is a "query" operation that retreives data (GET method/request).
    // The first parameter of the query is the type of the result of the request.
    // The second parameter of the query is the type of the body that is sent with the request (here string).
    getAllCars: builder.query<ICar[], string>({
      query: (url) => `/cars/${url}`,
      providesTags: ["cars"],
    }),
    getAllCarsAdminPriviledge: builder.query<ICar[], string>({
      query: (url) => `/cars/admin/${url}`,
      providesTags: ["cars"],
    }),
    getCar: builder.query<ICar, string>({
      query: (carId) => "/cars/" + carId, // attaches the following string to the baseURL. Request is being sent to `http://localhost:3000/api/cars/:carId`.
      providesTags: ["cars"],
    }),
    // The `createCar` endpoint is a "query" operation / mutation that mutates data (here POST method/request, but UPDATE or DELETE methods/requests are also mutations).
    // The first parameter of the mutation is the type of the result of the request.
    // The second parameter of the mutation is the type of the body that is sent with the request.
    createCar: builder.mutation<
      ICar,
      { model: string; brand: string; fuel: string }
    >({
      query: (body) => ({
        url: "/cars", // attaches the following string to the baseURL. Request is being sent to `http://localhost:3000/api/cars`.
        method: "POST", // defines the method of the request
        body, // defines the body of the request, the client input with which we want to updata db documens
      }),
      // when `cars` tag is invalidated, it will cause the endpoints which provide the `cars` tag to refetch data
      invalidatesTags: ["cars"],
    }),
    updateCar: builder.mutation<
      void,
      { model: string; brand: string; fuel: string; carId: string }
    >({
      query: (body) => ({
        url: "/cars/" + body.carId,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["cars"],
    }),
    deleteCar: builder.mutation<void, string>({
      query: (carId) => ({
        url: "/cars/" + carId,
        method: "DELETE",
      }),
      invalidatesTags: ["cars"],
    }),
    deleteCarAdminPriviledge: builder.mutation<void, string>({
      query: (carId) => ({
        url: "/cars/admin/" + carId,
        method: "DELETE",
      }),
      invalidatesTags: ["cars"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllCarsQuery,
  useGetAllCarsAdminPriviledgeQuery,
  useGetCarQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  useDeleteCarAdminPriviledgeMutation,
} = carsApiSlice;
