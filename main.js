// const KURENTO_WEBSOCKET_URI = "wss://159.89.231.194:8433/kurento"
const KURENTO_WEBSOCKET_URI = "wss://kurento.jsconsole.net:8433/kurento"

const create = () => {
    /*
    * (C) Copyright 2014 Kurento (http://kurento.org/)
    *
    * All rights reserved. This program and the accompanying materials
    * are made available under the terms of the GNU Lesser General Public License
    * (LGPL) version 2.1 which accompanies this distribution, and is available at
    * http://www.gnu.org/licenses/lgpl-2.1.html
    *
    * This library is distributed in the hope that it will be useful,
    * but WITHOUT ANY WARRANTY; without even the implied warranty of
    * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
    * Lesser General Public License for more details.
    *
    */

    function getopts(args, opts)
    {
    var result = opts.default || {};
    args.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { result[$1] = $3; });

    return result;
    };

    var args = getopts(location.search,
    {
    default:
    {
        // ws_uri: 'ws://' + location.hostname + ':8888/kurento',
        ws_uri: KURENTO_WEBSOCKET_URI,
        ice_servers: undefined
    }
    });

    if (args.ice_servers) {
    console.log("Use ICE servers: " + args.ice_servers);
    kurentoUtils.WebRtcPeer.prototype.server.iceServers = JSON.parse(args.ice_servers);
    } else {
    console.log("Use freeice")
    }


    // window.addEventListener('load', function(){
    //     var videoOutput = document.getElementById('videoOutput');
    //     var address = document.getElementById('address');
    //     address.value = 'http://files.kurento.org/video/puerta-del-sol.ts';
    var pipeline;
    var webRtcPeer;

    // startButton = document.getElementById('start');
    // startButton.addEventListener('click', start);

    // stopButton = document.getElementById('stop');
    // stopButton.addEventListener('click', stop);

    /* Written by Steven */
    function playURI(vidElement,uri){
        console.log("Kurento playURI",vidElement,uri);
        var options = {
        remoteVideo : vidElement // convert from jquery type element to normal DOM element
        };
        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error){
            if(error){
                return console.error(error);
            }
            let onOffer = makeCustomOnOffer(uri);
            webRtcPeer.generateOffer(onOffer);
            webRtcPeer.peerConnection.addEventListener('iceconnectionstatechange', function(event){
            if(webRtcPeer && webRtcPeer.peerConnection){
                console.log("oniceconnectionstatechange -> " + webRtcPeer.peerConnection.iceConnectionState);
                console.log('icegatheringstate -> ' + webRtcPeer.peerConnection.iceGatheringState);
            }
            });
        });
    }
    /* Written by Steven */
    function makeCustomOnOffer(customURI){
        return function customOnOffer(error, sdpOffer){
            if(error) return onError(error);

            kurentoClient(KURENTO_WEBSOCKET_URI, function(error, kurentoClient) {
                if(error) return onError(error);

                kurentoClient.create("MediaPipeline", function(error, p) {
                    if(error) return onError(error);

                    pipeline = p;

                    pipeline.create("PlayerEndpoint", {uri: customURI}, function(error, player){
                    if(error) return onError(error);

                    pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
                        if(error) return onError(error);

                setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError);

                        webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
                            if(error) return onError(error);

                    webRtcEndpoint.gatherCandidates(onError);

                            webRtcPeer.processAnswer(sdpAnswer);
                        });

                        player.connect(webRtcEndpoint, function(error){
                            if(error) return onError(error);

                            console.log("PlayerEndpoint-->WebRtcEndpoint connection established");

                            player.play(function(error){
                            if(error) return onError(error);

                            console.log("Player playing ...");
                            });
                        });
                    });
                    });
                });
            });
        }
    }
    

    function start() {
        if(!address.value){
        window.alert("You must set the video source URL first");
        return;
        }
        address.disabled = true;
        showSpinner(videoOutput);
        var options = {
        remoteVideo : videoOutput
        };
        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error){
            if(error){
            return console.error(error);
            }
            webRtcPeer.generateOffer(onOffer);
            webRtcPeer.peerConnection.addEventListener('iceconnectionstatechange', function(event){
            if(webRtcPeer && webRtcPeer.peerConnection){
                console.log("oniceconnectionstatechange -> " + webRtcPeer.peerConnection.iceConnectionState);
                console.log('icegatheringstate -> ' + webRtcPeer.peerConnection.iceGatheringState);
            }
            });
        });
    }

    function onOffer(error, sdpOffer){
        if(error) return onError(error);

        kurentoClient(args.ws_uri, function(error, kurentoClient) {
            if(error) return onError(error);

            kurentoClient.create("MediaPipeline", function(error, p) {
                if(error) return onError(error);

                pipeline = p;

                pipeline.create("PlayerEndpoint", {uri: address.value}, function(error, player){
                if(error) return onError(error);

                pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
                    if(error) return onError(error);

            setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError);

                    webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
                        if(error) return onError(error);

                webRtcEndpoint.gatherCandidates(onError);

                        webRtcPeer.processAnswer(sdpAnswer);
                    });

                    player.connect(webRtcEndpoint, function(error){
                        if(error) return onError(error);

                        console.log("PlayerEndpoint-->WebRtcEndpoint connection established");

                        player.play(function(error){
                        if(error) return onError(error);

                        console.log("Player playing ...");
                        });
                    });
                });
                });
            });
        });
    }

    function stop() {
        // address.disabled = false;
        if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;
        }
        if(pipeline){
        pipeline.release();
        pipeline = null;
        }
        // hideSpinner(videoOutput);
    }

    // });

    function setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError){
    webRtcPeer.on('icecandidate', function(candidate){
        console.log("Local icecandidate " + JSON.stringify(candidate));

        candidate = kurentoClient.register.complexTypes.IceCandidate(candidate);

        webRtcEndpoint.addIceCandidate(candidate, onError);

    });
    webRtcEndpoint.on('OnIceCandidate', function(event){
        var candidate = event.candidate;

        console.log("Remote icecandidate " + JSON.stringify(candidate));

        webRtcPeer.addIceCandidate(candidate, onError);
    });
    }

    function onError(error) {
    if(error)
    {
        console.error(error);
        stop();
    }
    }

    // function showSpinner() {
    //     for (var i = 0; i < arguments.length; i++) {
    //         arguments[i].poster = 'img/transparent-1px.png';
    //         arguments[i].style.background = "center transparent url('img/spinner.gif') no-repeat";
    //     }
    // }

    // function hideSpinner() {
    //     for (var i = 0; i < arguments.length; i++) {
    //         arguments[i].src = '';
    //         arguments[i].poster = 'img/webrtc.png';
    //         arguments[i].style.background = '';
    //     }
    // }

    // /**
    //  * Lightbox utility (to display media pipeline image in a modal dialog)
    //  */
    // $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
    //     event.preventDefault();
    //     $(this).ekkoLightbox();
    // });

    return {
        playURI,
        stop
    }
}

let s;// = create();

const playURI = function(){
    s = create();
    s.playURI(...arguments);
    window.onbeforeunload = function(){
        s.stop();
    };
}

document.addEventListener("DOMContentLoaded", function(){
    // Handler when the DOM is fully loaded
    var form = document.querySelector("form");
    form.onsubmit = submitted.bind(form);

    var urlParams = new URLSearchParams(window.location.search);
    let pass = urlParams.get("pass");
    if(pass){
        document.getElementById("pass").value=pass;
        submitted();
    }
});

window.notifyError = () => {
    document.querySelector("a").style="display:block;";
}

function submitted(event) {
    if(event)event.preventDefault();
    let pass = document.getElementById("pass").value;
    let uri = "rtsp://admin:"+pass+"@98.26.17.132:554"
    playURI(document.getElementById("vid"),uri)
    console.log("successfully played URI");
    document.querySelector("form").remove();
}
