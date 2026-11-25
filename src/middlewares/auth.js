
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { collections } from "../config/db.js";
import { ROLES } from "../config/constants.js";


export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized: access token is missing." });
    }

  
    const decoded = jwt.verify(token, env.jwtSecret);


    const user = await collections.users.findOne({ email: decoded.email });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user account not found." });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
    }


    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      image: user.image || "",
      phone: user.phone || "",
      role: user.role || ROLES.CUSTOMER,
    };

    next();
  } catch (error) {

    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Unauthorized: invalid or expired token." });
    }
    next(error); 
  }
};


const allowRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: please log in first." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: only ${allowedRoles.join(" / ")} can do this.`,
      });
    }

    next();
  };


export const verifyRenter = allowRoles(ROLES.CUSTOMER);
export const verifyOwner = allowRoles(ROLES.OWNER);
export const verifyAdmin = allowRoles(ROLES.ADMIN);
