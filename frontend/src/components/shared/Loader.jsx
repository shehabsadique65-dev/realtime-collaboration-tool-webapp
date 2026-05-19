const Loader = ({ text = 'Loading...' }) => (
  <div className="drawft-loader">
    <div className="drawft-spinner" />
    <p className="drawft-loader-text">{text}</p>
  </div>
);

export default Loader;
