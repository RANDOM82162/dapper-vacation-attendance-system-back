db = db.getSiblingDB("proyecto-dev");

db.admins.insertMany([
  {
    uid: "qFx3L0yuGSC2GsP2g9ORft7AsULZ",
    name: "User",
    email: "user@gmail.com",
    role: "Admin",
    photoURL:
      "https://user-images.githubusercontent.com/11250/39013954-f5091c3a-43e6-11e8-9cac-37cf8e8c8e4e.jpg",
    creationDateTS: 1755800865565,
  },
]);
