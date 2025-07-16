import { Link } from "react-router-dom";

const Logo = (props: { url?: string }) => {
  const { url = "/" } = props;
  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>
        <div className="flex h-6 w-6 items-center justify-center rounded-md  text-primary-foreground">
        <img
          src="/adminiXlogo.png"
          alt="Logo"
          className="h-6 w-auto" // Adjust size as needed
        />
        </div>
      </Link>
    </div>
  );
};

export default Logo;
