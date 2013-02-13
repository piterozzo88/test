//////////////////////////
//
// Authentication
// See "Logging the user in" on https://developers.facebook.com/mobile
//
//////////////////////////

var connected = false;

var user = [];

var permissions = ['user_status', 'publish_checkins', 'user_likes', 'publish_stream'];

//Detect when Facebook tells us that the user's session has been returned
function authUser() {
  FB.Event.subscribe('auth.statusChange', handleStatusChange);
}

// Handle status changes
function handleStatusChange(session) {
    //console.log('Got the user\'s session: ' + JSON.stringify(session));
    if (session.authResponse) {
        connected = true;
        //Fetch user's id, name, and picture
        FB.api('/me', {
          fields: 'name, picture'
        },
        function(response) {
          if (!response.error) {
            user = response;
            
            //console.log('Got the user\'s name and picture: ' + JSON.stringify(response));
            
            //Update display of user name and picture
          }
          
          //clearAction();
        });
    }
    else  {
      connected = false;
      //clearAction();
    }
}

//Check the current permissions to set the page elements.
//Pass back a flag to check for a specific permission, to
//handle the cancel detection flow.
function checkUserPermissions(permissionToCheck) {
  var permissionsFQLQuery = 'SELECT ' + permissions.join() + ' FROM permissions WHERE uid = me()';
  FB.api('/fql', { q: permissionsFQLQuery },
    function(response) {
      if (!connected) {
          if (permissionToCheck) {
            if (response.data[0][permissionToCheck] == 1) {
              return true;
            } else {
              
            } return false;
          }
          return true;
      }
  });
}

//Prompt the user to login and ask for the 'email' permission
function promptLogin(fun) {
  FB.login(fun, {scope: 'email'});
}

//This will prompt the user to grant you acess to a given permission
function promptPermission(permission, fun) {
  FB.login(fun, {scope: permission});
}

//See https://developers.facebook.com/docs/reference/api/user/#permissions
function uninstallApp() {
  FB.api('/me/permissions', 'DELETE',
    function(response) {
      //window.location.reload();
      // For may instead call logout to clear
      // cache data, ex: using in a PhoneGap app
      logout();
  });
}

//See https://developers.facebook.com/docs/reference/javascript/FB.logout/
function logout() {
  FB.logout(function(response) {
    window.location.reload();
  });
}