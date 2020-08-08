//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true});
mongoose.connect("mongodb+srv://USERNAME:PASSWORD@cluster0-lxveq.mongodb.net/todolistDB", { useNewUrlParser: true});


const itemsSchema = {
  //name: String
  name: {
    type: String,
    required: [true, "Please check your data entry, no name specified!"]
  }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List!"
});

const item2 = new Item({
  name: "Hit the + button to add new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  //const day = date.getDate();
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default Items to DB.");
        }
      });
      res.redirect("/");
    } else {
      // render list.ejs inside views folder
      res.render("list", {
        listTitle: "Today",
        newListItem: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // foundList is an object
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newListItem: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const postItem = new Item({
    name: itemName
  });

  if (listName == "Today") {
    postItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(postItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    //Item.deleteOne({_id: req.body.checkbox}, function(err) {
    Item.findByIdAndRemove(checkedItem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted " + checkedItem);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res) {
  res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server running on port 3000");
});
