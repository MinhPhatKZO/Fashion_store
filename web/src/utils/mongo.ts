export const getMongoId = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (id.$oid) return id.$oid;
  if (id._id) return id._id.toString();
  return id.toString();
};
