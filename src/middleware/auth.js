import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function autenticarToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ error: "Acesso negado!" });
  }

jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
  if (err) {
    return res.status(401).json({ error: "Token inválido!" });
  }

  req.usuario = decoded;
  req.usuarioId = decoded.id;

  next();
});

}
