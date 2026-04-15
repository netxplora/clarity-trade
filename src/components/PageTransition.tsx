import { motion } from "framer-motion";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="page-transition-wrapper">
    {children}
  </div>
);

export default PageTransition;
