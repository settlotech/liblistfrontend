/* Spinner — uses .spinner from index.css */
const Spinner = ({ className = '' }) => (
  <span className={`spinner ${className}`} role="status" aria-label="Loading" />
);

export default Spinner;
