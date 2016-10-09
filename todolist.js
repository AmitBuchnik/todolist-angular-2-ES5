/*--------------------------- Indexed DB ---------------------------*/

window.indexedDB = window.indexedDB ||
                   window.mozIndexedDB ||
                   window.webkitIndexedDB ||
                   window.msIndexedDB;

if (!window.indexedDB) {
    console.log("The browser doesn't support IndexedDB");
}

var indxDB = {};

indxDB.openDB = function () {
    indxDB.dbOpenDBRequest = window.indexedDB.open('todoDB', 1);

    indxDB.dbOpenDBRequest.onerror = function (event) {
        console.log('error: ' + event.target.errorCode);
        humusUtils.showMessage('Error', event.target.errorCode);
    };
    indxDB.dbOpenDBRequest.onsuccess = function (event) {
        console.log(event.target.result.objectStoreNames);

        //indxDB.dbDatabase = indxDB.dbOpenDBRequest.result;
        indxDB.dbDatabase = event.target.result;
        console.log("success: " + indxDB.dbDatabase);

        indxDB.dbDatabase.onerror = function (errorEvent) {
            // Generic error handler for all errors targeted at this database's requests!
            humusUtils.showMessage('Error', 'Database error: ' + errorEvent.target.errorCode);
        };
        indxDB.readAllItems();
    };
    indxDB.dbOpenDBRequest.onupgradeneeded = function (event) {
        indxDB.dbDatabase = event.target.result;

        //db.dbDatabase.deleteObjectStore('todo');

        let objectStore = indxDB.dbDatabase.createObjectStore('todo', {keyPath: 'timeStamp', autoIncrement: false});
        //objectStore.createIndex('timeStamp', 'timeStamp', {unique: true});
        console.log("creating db: " + indxDB.dbDatabase);

        let transaction = event.target.transaction;
        transaction.oncomplete = function (event) {
        };
    };
}

indxDB.closeDB = function () {
    indxDB.dbDatabase.close();
};

indxDB.addItem = function (obj = {timeStamp: timeStamp, item: item}) {
    // Create a new object ready to insert into the IDB
    var newItem = [ {timeStamp: obj.timeStamp, item: obj.item} ];

    // open a read/write db transaction, ready for adding the data
    var transaction = indxDB.dbDatabase.transaction('todo', 'readwrite')

    // report on the success of opening the transaction
    transaction.oncomplete = function(event) {
        console.log('Transaction completed: database modification finished');
    };

    transaction.onerror = function(event) {
        console.log('Transaction not opened due to error. Duplicate items not allowed');
        humusUtils.showMessage('Error', 'Transaction not opened due to error. Duplicate items not allowed');
    };

    // create an object store on the transaction
    var objectStore = transaction.objectStore('todo');
    console.log(objectStore.keyPath);

    // add our newItem object to the object store
    var objectStoreRequest = objectStore.add(newItem[0]);

    objectStoreRequest.onsuccess = function(event) {
        // report the success of our new item going into the database
        console.log('New item added to database');
    };
}

indxDB.readAllItems = function() {
    //indxDB.removeAllItems();

    let transaction = indxDB.dbDatabase.transaction('todo');
    let objectStore = transaction.objectStore('todo');

    objectStore.openCursor().onsuccess = function (event) {
        let cursor = event.target.result;
        if (cursor) {
            console.log('readAllItems(): timeStamp = ' + cursor.value.timeStamp + ' item = ' + cursor.value.item );
            indxDB.items.set(cursor.value.timeStamp, cursor.value.item);
            cursor.continue();
        }
        else {
            console.log('readAllItems(): no more entries!');
        }
    };

    transaction.oncomplete = function () {
        //angular.bootstrap(TodoListController, [DataService]);
        angular.bootstrap(TodoListController);
    };
}

indxDB.removeItem = function(timeStamp) {
    let request = indxDB.dbDatabase.transaction('todo', 'readwrite')
        .objectStore('todo')
        .delete(+timeStamp);

    request.onsuccess = function (event) {
        console.log("removeItem(): the data item was removed from the database");
    };

    request.onerror = function (event) {
        console.log("removeItem(): problem with removing a data item from the database");
    }
}

indxDB.removeAllItems = function() {
    let transaction = indxDB.dbDatabase.transaction('todo', 'readwrite');
    let objectStore = transaction.objectStore('todo');

    // clear all the data out of the object store
    var objectStoreRequest = objectStore.clear();

    objectStoreRequest.onsuccess = function (event) {
        // report the success of our clear operation
        console.log('Data cleared');
    };
}

indxDB.items = new Map();

/*--------------------------- Indexed DB ---------------------------*/

/*class DataService
{
    constructor ()
    {
        this.items = new Map();
    }
}
let dataService = new DataService();*/

function TodoListController () {
    //this.items = []; //["Clean House", "Prepare Dinner", "Buy Candles"];
    this.items = indxDB.items;

    this.addItem = function(item) {
        if (item === '') {
            //alert("You must write something!");
            $('#myModal').modal({keyboard: true, show: true});
        }
        else {
            let timeStamp = Date.now();
            this.items.set(timeStamp, item);
            indxDB.addItem({timeStamp: timeStamp, item: item});
        }
    };

    this.removeItem = function (item) {
        this.items.delete(item[0]);
        indxDB.removeItem(item[0]);
    };

    this.finishedTyping = function($event) {
        if($event.which === 13) {
            this.addItem($event.target.value);
        }
    }

    this.addCheckedSymbol = function ($event) {
        $event.target.classList.toggle('checked');
    };
}

TodoListController.annotations = [
    new angular.ComponentAnnotation({
        selector: "todo-list-application",
        //appInjector: [DataService]
    }),
    new angular.ViewAnnotation({
        template:
        /*'<div class="container">' +
        '<div id="myDIV" class="header">' +
            '<h2>My To Do List</h2>' +
            '<form>' +
                '<div class="form-group row">' +
                    '<div class="col-xs-10">' +
                        '<input class="form-control input-style" #enteredtext (keyup)="finishedTyping($event)" placeholder="What do you need to do?">' +
                    '</div>' +
                    '<div class="col-xs-2">' +
                        '<input type="submit" value="Add Item" class="btn btn-primary" (click)="addItem(enteredtext.value)">' +
                         /!*'<span (click)="addItem(enteredtext.value)" class="addBtn">Add Item</span>' +*!/
                     '</div>' +
                '</div>' +
            '</form>' +
        '</div>' +*/
        '<div class="page-header header">' +
            '<div class="input-group">' +
                '<input type="text" class="form-control" #enteredtext (keyup)="finishedTyping($event)"' +
                    ' placeholder="Title...">' +
                '<span class="input-group-btn">' +
                    '<button class="btn btn-primary" (click)="addItem(enteredtext.value)" type="button">Add Item</button>' +
                '</span>' +
            '</div>' +
        '</div>' +
        '<div class="list-group">' +
            '<a href="#" *ng-for="var item of items.entries()" (click)="addCheckedSymbol($event)" class="list-group-item list-group-item-action">' +
            '{{ item[1] }} <span class="close" (click)="removeItem(item)" )>\u00D7</span>' +
            '</a>' +
        '</div>' +
        '</div>' +
        '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
            '<div class="modal-dialog" role="document">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                            '<span aria-hidden="true">&times;</span>' +
                        '</button>' +
                        '<h4 class="modal-title" id="myModalLabel">' +
                            'Message' +
                        '</h4>' +
                     '</div>' +
                    '<div class="modal-body">' +
                        'You must write something!' +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-secondary" data-dismiss="modal">' +
                            'Close' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>'+
        '</div>',
        directives: [angular.NgFor,angular.NgIf]
    })
];

//TodoListController.parameters = [[DataService]];

document.addEventListener("DOMContentLoaded", function() {
    indxDB.openDB();
    //angular.bootstrap(TodoListController);
});