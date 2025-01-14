/*
This is the frontend module for viewing post.
The module retrieves the post from the firebase database and display post details. 
The owner of the post can manage the waiting list
and the participant list in the admin pannel at the 
bottom of this page.
*/

import React from "react";
import { storage, f_database, auth } from "../Firebase.js";
import "./Post.css";
import Button from '@material-ui/core/Button';
import banner from '../Image/banner.jpeg';

class Post extends React.Component {
  //initialize the state of the class
  constructor(props) {
    super(props);
    this.state = {
      post: null,
      // I you can set disable_button to true if you want to gray-out the button when the members are full or something like that

      disable_button: false,
      w_list: null,
      isOwner: false,
    }
    this.tempFunc = this.tempFunc.bind(this);
  }

  //change the ui base on whether or not the user is the owner of the post
  onAuthStateChanged = () => {
    if (auth.currentUser && auth.currentUser.email === this.state.post.owner) {
      this.setState({ isOwner: true })
      document.getElementById("requestButton").style.display = "none";
    }

  }

  // retrieves the post details from firebase database
  componentWillMount() {
    const id = parseInt(this.props.match.params.id);
    var data = null;
    f_database.ref("posts").child(id).on("value", snapshot => {
      data = snapshot.val()
      this.setState({ post: data }, () => this.onAuthStateChanged())
    })
  }


  //call this function when the request join button is hitted
  RequestJoin = () => {
    if (auth.currentUser === null) {
      alert("please sign in first")
      return
    }
    let id = 1;
    let flag = 1;
    f_database.ref("posts").child(this.state.post.pid)
      .child("waiting_list")
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          if (snap.val() === auth.currentUser.email) {
            flag = 0
          }
          var key = snap.key;
          id = parseInt(key, 10) + 1
        })
        if (flag !== 0) {
          f_database.ref("posts").child(this.state.post.pid).child("waiting_list").update({ [id]: auth.currentUser.email })
        } else {
          alert("You're already in the waiting list!")
          document.getElementById("requestButton").style.display = "none";
        }
      })

  }

  //A button for developers team only, generating testing requests from dummy users
  RequestJoin_dev = () => {
    let id = 1;
    f_database.ref("posts").child(this.state.post.pid)
      .child("waiting_list")
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          var key = snap.key;
          id = parseInt(key, 10) + 1
        })
        f_database.ref("posts").child(this.state.post.pid).child("waiting_list").update({ [id]: "dummy@dummy.com" + id })

      })

  }

  //call this function when the owner of the post
  // click accept button in the wating list to accept a applicant
  AcceptJoin = (email) => {
    let id = 1;
    let flag = 1;
    f_database.ref("posts").child(this.state.post.pid)
      .child("participant")
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          if (snap.val() === email) {
            flag = 0
          }
          var key = snap.key;
          id = parseInt(key, 10) + 1
        })

      })
    if (flag !== 0) f_database.ref("posts").child(this.state.post.pid).child("participant").update({ [id]: email })
    f_database.ref("posts").child(this.state.post.pid).child("waiting_list").orderByKey()
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          if (email === snap.val()) snap.ref.remove()
        })
      })
  }

  //when rejecting an applicant in waiting list,
  //delete then entry in database
  RejectJoin = (email) => {
    f_database.ref("posts").child(this.state.post.pid).child("waiting_list")
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          if (email === snap.val()) snap.ref.remove()
        })
      })
  }

  //when removing a participant
  //delete then entry in database
  RemoveParticipant = (email) => {
    f_database.ref("posts").child(this.state.post.pid).child("participant")
      .once("value", snapshot => {
        snapshot.forEach(snap => {
          if (email === snap.val()) snap.ref.remove()
        })
      })
  }


  // function to buffer the query result of firebase to local and assembly accordingly
  tempFunc = () => {
    if (this.state.post.waiting_list == null) {
      return [];
    }
    var temp_list = [];
    var i;
    for (i = 0; i < 100; i++) {
      if (this.state.post.waiting_list[i] == null) {
        continue;
      }
      temp_list = [...temp_list, this.state.post.waiting_list[i]]
    }
    var temp = temp_list.filter((e) => {
      return e != null;
    })
    return temp;
  }
  // function to buffer the query result of firebase to local and assembly accordingly
  tempFunc_parti = () => {
    if (this.state.post.participant == null) {
      return [];
    }
    var temp_list = [];
    var i;
    for (i = 0; i < 100; i++) {
      if (this.state.post.participant[i] == null) {
        continue;
      }
      temp_list = [...temp_list, this.state.post.participant[i]]
    }
    var temp = temp_list.filter((e) => {
      return e != null;
    })
    return temp;
  }



  render() {

    if (this.state.post) {
      return (

        <header>
          <div className="post-header">
            <img src={banner} />
          </div>

          <div className="row">

            <div className="leftcolumn">
              <img src={this.state.post.url} />
            </div>


            <div className="rightcolumn">
              <div className="card">
                <div className="post-title"><h2>Title: {this.state.post.title}</h2></div>
                <div className="post-creator">Creator: {this.state.post.owner}</div>
                <div className="post-location">Location: {this.state.post.location}</div>
                <div className="post-groupsize">Group Size:{this.state.post.size}</div>
                <div className="post-period">Period: {this.state.post.period}</div>
                <div className="post-style">Travelling Style: {this.state.post.travel_style}</div>
                <div className="post-remark">Remark: {this.state.post.remark}</div>
                <div>
                  <Button onClick={this.RequestJoin}
                    variant="contained"
                    size="small"
                    color="primary"
                    style={{ margin: 10 }}
                    disabled={this.state.disable_button}
                    id="requestButton" >
                    Request Join
                </Button>
                  <Button onClick={this.RequestJoin_dev}
                    variant="contained"
                    size="small"
                    color="secondary"
                    style={{ margin: 10 }}
                    disabled={this.state.disable_button}
                    id="requestButton_dev" >
                    Random Request(for dev)
                </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="row" id="owner_panel">

            <div className="leftcolumn">
              Participant:
              {this.state.post.participant ?
                this.tempFunc_parti().map((item) =>
                  <div>
                    {item}
                    <Button size="small" color="secondary" style={{ display: this.state.isOwner ? "inline" : "none" }} onClick={() => {
                      this.RemoveParticipant(item)
                    }}>
                      Remove</Button>
                  </div>)
                : "None"}
            </div>

            <div className="rightcolumn">
              <div className="card">
                Waiting List:
               {this.state.post.waiting_list ? //console.log(typeof this.state.post.waiting_list)
                  this.tempFunc().map((item) =>
                    <div>
                      {item}

                      <Button size="small" color="primary" style={{ display: this.state.isOwner ? "inline" : "none" }} onClick={() => {
                        this.AcceptJoin(item)
                      }}>
                        Accept</Button>
                      <Button size="small" color="secondary" style={{ display: this.state.isOwner ? "inline" : "none" }} onClick={() => {
                        this.RejectJoin(item)
                      }}>
                        Reject</Button>
                    </div>)
                  : "None"}
              </div>
            </div>
          </div>

        </header>
      );
    } else {
      return (
        <header>
          <div className="post-header">
            The Post is Empty
          </div>
        </header>
      )
    }
  }
}

export default Post;
