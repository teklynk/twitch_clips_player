$(document).ready(function () {
    // clear localStorage on load. Some clips have a expire time that needs to be refreshed and can not sit in localStorage for too long.
    localStorage.clear();
    console.log('Cleared localStorage');

    // Function to randomly select a api server
    function setRandomServer() {
        // set the api gateway servers 
        const servers = ["https://twitchapi.teklynk.com", "https://twitchapi.teklynk.dev", "https://twitchapi2.teklynk.dev"];

        // Randomly select a server
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];

        return selectedServer;
    }

    // Call the function
    const apiServer = setRandomServer();

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // Array Shuffler
    function shuffleArray(arr) {
        arr.sort(() => Math.random() - 0.5);
    }

    // URL values
    let channel = getUrlParameter('channel').toLowerCase().trim();
    let mainAccount = getUrlParameter('mainAccount').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let dateRange = getUrlParameter('dateRange').trim();
    let delay = getUrlParameter('delay').trim();
    let preferFeatured = getUrlParameter('preferFeatured').trim();
    let showText = getUrlParameter('showText').trim();
    let showDetails = getUrlParameter('showDetails').trim();
    let ref = getUrlParameter('ref').trim();
    let clientId = getUrlParameter('clientId').trim();
    let customText = getUrlParameter('customText').trim();
    let detailsText = getUrlParameter('detailsText').trim();
    let command = getUrlParameter('command').trim();
    let showFollowing = getUrlParameter('showFollowing').trim();
    let exclude = getUrlParameter('exclude').trim();
    let themeOption = getUrlParameter('themeOption').trim();
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let following = "";
    let followCount = 0;
    let playCount = 0;

    if (!showDetails) {
        showDetails = "false"; //default
    }

    if (!preferFeatured) {
        preferFeatured = "false"; //default
    }

    if (!showFollowing) {
        showFollowing = "false"; //default
    }

    if (!exclude) {
        exclude = ""; //default
    }

    if (!showText) {
        showText = "false"; //default
    }

    if (!limit) {
        limit = "20"; //default
    }

    if (!dateRange || dateRange === "0") {
        dateRange = ""; //default
    } else {
        // Get client current date
        let todayDate = new Date();

        // subtract dateRange from todayDate
        let startDate = new Date(new Date().setDate(todayDate.getDate() - parseInt(dateRange)));

        // format dates
        startDate = startDate.toISOString().slice(0, 10);
        todayDate = todayDate.toISOString().slice(0, 10);

        // set the daterange url parameter for the api endpoint
        dateRange = "&start_date=" + startDate + "T00:00:00Z&end_date=" + todayDate + "T00:00:00Z";
    }

    if (!delay) {
        delay = "0"; //default
    }

    let client = '';

    // onload set the local storage for clip_id to false.
    localStorage.setItem('clip_id', '');

    // Load theme css file if theme is set
    if (parseInt(themeOption) > 0) {
        $('head').append('<link rel="stylesheet" type="text/css" href="assets/css/theme' + themeOption + '.css">');
    }

    // If Auth token is set, then connect to chat using oauth, else connect anonymously.
    if (mainAccount > '' && ref > '') {
        // Connect to twitch - needs auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: { reconnect: true },
            identity: {
                username: mainAccount,
                password: 'oauth:' + atob(ref)
            },
            channels: [mainAccount]
        });

        client.connect().catch(console.error);

    } else if (mainAccount > '' && ref == '') {
        // Connect to twitch anonymously - does not need auth token
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: { reconnect: true },
            channels: [mainAccount]
        });

        client.connect().catch(console.error);
    }

    // Get game details function
    function game_by_id(game_id) {
        let jsonParse = JSON.parse($.getJSON({
            'url': apiServer + "/getgame.php?id=" + game_id,
            'async': false
        }).responseText);

        return jsonParse;
    }

    if (showFollowing === 'true' && ref > '' && clientId > '') {

        function following_pagination(cursor) {
            let jsonParse;
            let apiUrl;

            if (cursor) {
                apiUrl = apiServer + "/getuserfollowing.php?channel=" + mainAccount + "&limit=100&ref=" + ref + "&clientId=" + clientId + "&after=" + cursor
            } else {
                apiUrl = apiServer + "/getuserfollowing.php?channel=" + mainAccount + "&limit=100&ref=" + ref + "&clientId=" + clientId
            }

            jsonParse = JSON.parse($.getJSON({
                'url': apiUrl,
                'async': false
            }).responseText);

            return jsonParse;
        }

        // Globals: following, followCount
        function concatFollowing(jsonData) {
            $.each(jsonData, function (i, val) {
                following += val['broadcaster_login'] + ",";
                followCount++;
            });
        }

        // Json following data - page 1
        let following_json = following_pagination();

        concatFollowing(following_json.data);

        // Start the Following pagination
        while (following_json.pagination['cursor']) {
            following_json = following_pagination(following_json.pagination['cursor']);
            concatFollowing(following_json.data);
        }

        // Remove the last comma from string
        following = following.replace(/,\s*$/, "");

        // Exclude channels from following
        let channelListArray = following.split(',');
        let excludeArray = exclude.split(',');
        channelListArray = channelListArray.filter(item => !excludeArray.includes(item));
        followList = channelListArray.join(',');

        // Set channel to equal following list/string
        channel = followList.split(',').map(element => element.trim());

    } else {

        // Convert string to an array/list
        channel = channel.split(',').map(element => element.trim());
    }

    // Randomly grab a channel from the list to start from
    if (channel.length > 0) {
        // shuffle the list of channel names
        shuffleArray(channel);
        clip_index = 0;
    } else {
        // grab the first item in the list to start from
        clip_index = 0;
    }

    console.log(channel);

    // Create new video element
    let curr_clip = document.createElement('video');
    $(curr_clip).appendTo('#container');

    //if command is set
    if (command) {
        // triggers on message
        client.on('chat', (channel, user, message, self) => {

            if (self || !message.startsWith('!')) return;

            if (user['message-type'] === 'chat' && message.startsWith('!' + command)) {

                // Remove element before loading the clip
                const textContainer = document.querySelectorAll("#text-container");
                Array.from(textContainer).forEach((element) => element?.remove());

                const detailsContainer = document.querySelectorAll("#details-container");
                Array.from(detailsContainer).forEach((element) => element?.remove());

                // Properly remove video source
                let videoElement = document.querySelector("video");
                videoElement.pause();
                videoElement.removeAttribute("src"); // empty source
                videoElement.load();

                // Get second command. ie: stop
                let commandOption = message.split(' ')[1];

                // Stop the clips player
                if (commandOption === "stop") {
                    // Remove element before loading the clip
                    $('#container').empty();
                    window.location.reload();
                }
            }

            if (user.mod || user.username === mainAccount) {
                // Plays clips when command is used
                loadClip(channel[clip_index]);
            }
        });

    } else {
        // Plays clips when scene is active
        if (channel.length > 1 && typeof channel[clip_index + 1] !== 'undefined') {
            preloadNextClip(channel[clip_index + 1]);
        }
        loadClip(channel[clip_index]);
    }

    // Hard-coded commands to control the current clip. Limited to mods and streamer
    // !clipskip, !clippause, !clipplay
    // Triggers on message
    client.on('chat', (channel, user, message, self) => {

        if (self || !message.startsWith('!')) return;

        if (user['message-type'] === 'chat' && message.startsWith('!')) {

            if (user.mod || user.username === mainAccount) {

                let videoElement = document.querySelector("video");

                if (message === "!clipskip") {

                    console.log("Skipping Clip");
                    nextClip(true); // skip clip
                    return false;

                } else if (message === "!clippause") {

                    console.log("Pausing Clip");
                    videoElement.pause(); // pause clip

                } else if (message === "!clipplay" && videoElement.paused) {

                    console.log("Playing Clip");
                    videoElement.play(); // continue playing clip if was paused

                } else if (message === "!clipreload") {
                    // Remove element before loading the clip
                    $('#container').empty();
                    window.location.reload(); // Reload browser source

                }

            }

        }

    });

    async function preloadNextClip(channelName) {

        if (localStorage.getItem(channelName) === null && typeof channelName !== 'undefined') {
            console.log('Preloading next clip: ' + channelName);

            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            let apiUrl;

            try {
                // Add a delay before the fetch operation
                await sleep(1000); // 1000 milliseconds = 1 second

                if (preferFeatured !== "false") {
                    apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=true&limit=" + limit + "&shuffle=true" + dateRange;
                } else {
                    apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=false&limit=" + limit + "&shuffle=true" + dateRange;
                }

                clips_json = JSON.parse($.getJSON({
                    'url': apiUrl,
                    'async': false
                }).responseText);

                // If dateRange or preferFeatured is set but no clips are found or only 1 clip is found. Try to pull any clip. 
                if (clips_json.data.length === 0 && (dateRange > "" || preferFeatured !== "false")) {
                    asyncResponse = await fetch(`${apiServer}/getuserclips.php?channel=${channelName}&limit=${limit}&shuffle=true`);
                    clips_json = await asyncResponse.json();  // Parse the JSON response
                    console.log('No clips found matching dateRange or preferFeatured filter. PULL ANY Clip found from: ' + channelName);
                }

                if (clips_json.data.length > 0) {
                    console.log('Set ' + channelName + ' in localStorage');
                    // Store the data in localStorage
                    localStorage.setItem(channelName, JSON.stringify(clips_json));
                }
            } catch (error) {
                console.error('Error while preloading clip:', error);
            }
        }
    }

    // Get and play the clip
    function loadClip(channelName) {

        let clips_json = "";
        let apiUrl;

        // Json data - Ajax calls
        // if localstorage does not exist
        if (localStorage.getItem(channelName) === null && typeof channelName !== 'undefined') {
            try {
                if (preferFeatured !== "false") {
                    apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=true&limit=" + limit + "&shuffle=true" + dateRange;
                } else {
                    apiUrl = apiServer + "/getuserclips.php?channel=" + channelName + "&prefer_featured=false&limit=" + limit + "&shuffle=true" + dateRange;
                }

                clips_json = JSON.parse($.getJSON({
                    'url': apiUrl,
                    'async': false
                }).responseText);

                // If dateRange or preferFeatured is set but no clips are found or only 1 clip is found. Try to pull any clip. 
                if (clips_json.data.length === 0 && (dateRange > "" || preferFeatured !== "false")) {
                    clips_json = JSON.parse($.getJSON({
                        'url': apiServer + "/getuserclips.php?channel=" + channelName + "&limit=" + limit + "&shuffle=true",
                        'async': false
                    }).responseText);

                    console.log('No clips found matching dateRange or preferFeatured filter. PULL ANY Clip found from: ' + channelName);
                }

                if (clips_json.data.length > 0) {
                    console.log('Set ' + channelName + ' in localStorage');
                    localStorage.setItem(channelName, JSON.stringify(clips_json));
                } else {
                    nextClip(true);
                }
            } catch (e) {
                // Sometimes the api returns an error. Usually when a channel no longer exists
                if (e.name === 'TypeError' || e.name === 'SyntaxError') {
                    console.error(e.name + ' found. Skipping...');
                    nextClip(true);
                    return false;
                }
                if (e.name === 'QuotaExceededError') {
                    console.error('LocalStorage Quota Exceeded. Please free up some space by deleting unnecessary data.');
                    // automatically clear localstorage if it exceeds the quota
                    localStorage.clear();
                    console.log('Cleared localStorage');
                    nextClip(true);
                    return false;
                } else {
                    console.error('An error occurred:', e);
                }
            }
        } else {
            // Retrieve the object from storage
            console.log('Pulling ' + channelName + ' from localStorage');
            clips_json = JSON.parse(localStorage.getItem(channelName));
        }

        // If no user clips exist, then skip to the next channel
        if (!clips_json.data || typeof clips_json.data === 'undefined' || clips_json.data.length === 0) {
            console.log('NO CLIPS found. Skipping');
            nextClip(true); // skip clip
            return false;
        }

        // Grab a random clip index anywhere from 0 to the clips_json.data.length.
        if (channel.length > 1) {

            console.log('Using random selection logic instead of shuffle');
            randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);

        } else {

            // Play clips in the order they were recieved
            if (clips_json.data.length === 1 || clips_json.data.length === playCount) {

                playCount = 1;
                randomClip = playCount - 1;

                // If only one channel is being used with the clips player
            } else if (channel.length === 1) {

                playCount++;

                if (playCount >= 1) {
                    randomClip = playCount - 1;
                }

            } else {
                // Default
                randomClip = 0;

            }

        }

        // log output from each clip for debugging
        console.log('Playing clip Channel: ' + clips_json.data[randomClip]['broadcaster_name']);
        console.log('Playing clip Index: ' + randomClip);
        console.log('Playing clip Item: ' + clips_json.data[randomClip]['item']);
        console.log('Playing clip ID: ' + clips_json.data[randomClip]['id']);
        console.log('Data length: ' + clips_json.data.length)

        // Create video element and load a new clip

        // adding a poster will help reduce the gap between clips.
        // set &delay=1 in the url if you want an intentional delay/gap between clips.
        if (parseInt(delay) === 0) {
            curr_clip.poster = clips_json.data[randomClip]['thumbnail_url'];
        }
        curr_clip.src = clips_json.data[randomClip]['clip_url'];
        curr_clip.autoplay = true;
        curr_clip.controls = false;
        curr_clip.volume = 1.0;
        curr_clip.load();

        // Show channel name on top of video
        if (showText === 'true' && typeof clips_json.data[randomClip]['broadcaster_name'] !== 'undefined') {
            setTimeout(function () {
                if (customText) {
                    // custom message to show on top of clip. includes {channel} name as a variable
                    customText = getUrlParameter('customText').trim();
                    customText = customText.replace("{channel}", clips_json.data[randomClip]['broadcaster_name']);
                    $("<div id='text-container'><span class='title-text'>" + decodeURIComponent(customText) + "</span></div>").appendTo('#container');
                } else {
                    $("<div id='text-container'><span class='title-text'>" + clips_json.data[randomClip]['broadcaster_name'] + "</span></div>").appendTo('#container');
                }
            }, 500); // wait time
        } else {
            // Remove element before loading the clip
            const textContainer = document.querySelectorAll("#text-container");
            Array.from(textContainer).forEach((element) => element?.remove());

            const detailsContainer = document.querySelectorAll("#details-container");
            Array.from(detailsContainer).forEach((element) => element?.remove());
    }

        // Show clip details panel
        if (showDetails === 'true' && typeof clips_json.data[randomClip]['broadcaster_name'] !== 'undefined') {
            setTimeout(function () {
                if (detailsText) {

                    if (document.getElementById("details-container")) {
                        document.getElementById("details-container").remove();
                    }

                    // custom clip details text
                    detailsText = getUrlParameter('detailsText').trim();
                    detailsText = detailsText.replace("{channel}", clips_json.data[randomClip]['broadcaster_name']);

                    // Show clip title if it exists
                    if (detailsText.includes("{title}")) {
                        if (clips_json.data[randomClip]['title']) {
                            detailsText = detailsText.replace("{title}", clips_json.data[randomClip]['title']);
                        } else {
                            detailsText = detailsText.replace("{title}", "?");
                        }
                    }

                    // Get game name/title using the game_id from the clip's json data
                    if (detailsText.includes("{game}")) {
                        // Show game title if it exists
                        if (clips_json.data[randomClip]['game_id']) {
                            let game = game_by_id(clips_json.data[randomClip]['game_id']);
                            detailsText = detailsText.replace("{game}", game.data[0]['name']);
                        } else {
                            detailsText = detailsText.replace("{game}", "?");
                        }
                    }

                    // Format created_at date
                    if (detailsText.includes("{created_at}")) {
                        detailsText = detailsText.replace("{created_at}", moment(clips_json.data[randomClip]['created_at']).format("MMMM D, YYYY"));
                    }

                    if (detailsText.includes("{creator_name}")) {
                        detailsText = detailsText.replace("{creator_name}", clips_json.data[randomClip]['creator_name']);
                    }

                    let dText = "";

                    // split on line breaks and create an array
                    let separateLines = detailsText.split(/\r?\n|\r|\n/g);

                    // interate over separateLines array
                    separateLines.forEach(lineBreaks);

                    // generate html for each linebreak/item in array
                    function lineBreaks(item, index) {
                        dText += "<div class='details-text item-" + index + "'>" + item + "</div>";
                    }

                    $("<div id='details-container'>" + dText + "</div>").appendTo('#container');
                }
            }, 500); // wait time
        } else {
            // Remove element before loading the clip
            const textContainer = document.querySelectorAll("#text-container");
            Array.from(textContainer).forEach((element) => element?.remove());

            const detailsContainer = document.querySelectorAll("#details-container");
            Array.from(detailsContainer).forEach((element) => element?.remove());
        }

        // Move to the next clip when the current one finishes playing
        curr_clip.addEventListener("ended", nextClip);
    }

    function nextClip(skip = false) {

        // Remove element before loading the clip
        const textContainer = document.querySelectorAll("#text-container");
        Array.from(textContainer).forEach((element) => element?.remove());

        const detailsContainer = document.querySelectorAll("#details-container");
        Array.from(detailsContainer).forEach((element) => element?.remove());

        // Properly remove video source
        let videoElement = document.querySelector("video");
        videoElement.pause();
        videoElement.removeAttribute("src"); // empty source
        videoElement.load();

        if (clip_index < channel.length - 1) {
            clip_index += 1;
        } else {
            clip_index = 0;
        }

        if (skip === true) {
            // Skips to the next clip if a clip does not exist
            console.log("Skipping clip...");
            loadClip(channel[clip_index]);
            curr_clip.play();
        } else {
            if (channel.length > 1 && typeof channel[clip_index + 1] !== 'undefined') {
                preloadNextClip(channel[clip_index + 1]);
            }
            // Adjust the delay in the url, else delay=0
            setTimeout(function () {
                // Play a clip
                loadClip(channel[clip_index]);
                curr_clip.play();
            }, parseInt(delay) * 1000 / 2); // wait time
        }

    }
});