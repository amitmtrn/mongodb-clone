const MongoClient = require('mongodb').MongoClient;

function getCollections(url) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, (err, db) => {
      if(err) reject(err);
      db.listCollections().toArray((err, collections) => {
        if(err) reject(err);

        resolve(collections);
        db.close();
      });
    });
  });
}

function cloneDatabase(collections, srcUrl, destUrl) {
  MongoClient.connect(destUrl, (destErr, destDb) => {
    MongoClient.connect(srcUrl, (srcErr, srcDb) => {
      if(srcErr || destErr) process.exit(1);

      collections.forEach((collection, i) => {
        if(collection.name) {
          console.log('coping: ' + collection.name);
          destDb.createCollection(collection.name, collection.options, () => {
            srcDb.collection(collection.name, (err, data) => {
              if(err) process.exit(1);
              data.find().toArray((err, docs) => {
                if(err) process.exit(1);
                const col = destDb.collection(collection.name);
                col.insertMany(docs).then(() => {
                  console.log('copied: ' + collection.name);
                  if(i === collections.length -1) {
                    srcDb.close();
                    destDb.close();
                  }
                });
              });

            });
          });
        }
      });

    });
  });
}

module.export = (src, dest) => {
  getCollections(src)
    .then((collections) => {
      cloneDatabase(collections, src, dest);
    })
}
