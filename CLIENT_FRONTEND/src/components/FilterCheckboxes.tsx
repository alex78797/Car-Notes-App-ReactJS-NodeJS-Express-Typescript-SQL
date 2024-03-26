import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { carBrands, fuels } from "../data/data";
import FilterCheckbox from "./FilterCheckbox";

/**
 *
 * @returns A form which contains all the checkboxes. The checkboxes are used to filter the car notes.
 */
function FilterCheckboxes() {
  return (
    <Form>
      <fieldset>
        <Form.Group as={Row}>
          <Form.Label as="legend" column sm={2}>
            Brand
          </Form.Label>
          <Col sm={10} className="mt-2">
            {carBrands.map((carBrand, index) => (
              <FilterCheckbox key={index} filter={carBrand} />
            ))}
          </Col>

          <Form.Label as="legend" column sm={2}>
            Fuel
          </Form.Label>
          <Col sm={10} className="mt-2">
            {fuels.map((fuel, index) => (
              <FilterCheckbox key={index} filter={fuel} />
            ))}
          </Col>
        </Form.Group>
      </fieldset>
    </Form>
  );
}

export default FilterCheckboxes;
