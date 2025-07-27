// 音乐数据（现在为空，等待用户选择）
let songs = [];
let currentSongIndex = 0;
let objectURLs = []; // 存储生成的Object URL

// 获取DOM元素
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const playlistEl = document.getElementById('playlist');
const songTitleEl = document.querySelector('.song-title');
const songArtistEl = document.querySelector('.song-artist');
const fileInput = document.getElementById('file-input');

// 初始化播放列表
function initPlaylist() {
    playlistEl.innerHTML = '';
    
    if (songs.length === 0) {
        playlistEl.innerHTML = '<div class="playlist-empty">请点击上方按钮添加本地音乐文件</div>';
        return;
    }
    
    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.classList.add('playlist-item');
        if (index === currentSongIndex) {
            songElement.classList.add('active');
        }
        
        songElement.innerHTML = `
            <div class="song-cover">
                <i class="fas fa-music"></i>
            </div>
            <div class="song-details">
                <div class="playlist-title">${song.title}</div>
                <div class="playlist-artist">${song.artist || '未知艺术家'}</div>
            </div>
            <div class="playlist-duration">${song.duration || '0:00'}</div>
        `;
        
        songElement.addEventListener('click', () => {
            loadSong(index);
            playSong();
        });
        
        playlistEl.appendChild(songElement);
    });
}

// 加载歌曲
function loadSong(index) {
    if (songs.length === 0) return;
    
    // 更新当前活动歌曲
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const song = songs[index];
    songTitleEl.textContent = song.title;
    songArtistEl.textContent = song.artist || '未知艺术家';
    
    audioPlayer.src = song.src;
    currentSongIndex = index;
    
    // 重置进度条
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    
    // 当元数据加载完成后更新持续时间
    audioPlayer.onloadedmetadata = function() {
        const duration = audioPlayer.duration;
        if (!isNaN(duration) && duration > 0) {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            durationEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            // 更新歌曲对象的持续时间
            songs[index].duration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            // 更新播放列表中的持续时间显示
            if (document.querySelectorAll('.playlist-item')[index]) {
                document.querySelectorAll('.playlist-duration')[index].textContent = songs[index].duration;
            }
        }
    };
}

// 播放歌曲
function playSong() {
    audioPlayer.play()
        .then(() => {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playBtn.title = '暂停';
        })
        .catch(e => {
            console.error("播放失败:", e);
            alert("播放失败，请确保文件是有效的音频格式");
        });
}

// 暂停歌曲
function pauseSong() {
    audioPlayer.pause();
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    playBtn.title = '播放';
}

// 下一首
function nextSong() {
    if (songs.length === 0) return;
    
    currentSongIndex++;
    if (currentSongIndex >= songs.length) {
        currentSongIndex = 0;
    }
    loadSong(currentSongIndex);
    playSong();
}

// 上一首
function prevSong() {
    if (songs.length === 0) return;
    
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songs.length - 1;
    }
    loadSong(currentSongIndex);
    playSong();
}

// 更新进度条
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    
    // 确保duration是有效值
    if (!isNaN(duration) && duration > 0) {
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }
    
    // 更新时间
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
}

// 设置进度
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    if (!isNaN(duration) && duration > 0) {
        audioPlayer.currentTime = (clickX / width) * duration;
    }
}

// 更新音量
function setVolume() {
    audioPlayer.volume = volumeSlider.value;
}

// 处理文件选择
fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    // 释放之前创建的Object URL
    releaseObjectURLs();
    
    // 重置歌曲数组
    songs = [];
    
    // 处理每个文件
    files.forEach(file => {
        if (file.type.startsWith('audio/')) {
            // 为文件创建Object URL
            const objectURL = URL.createObjectURL(file);
            objectURLs.push(objectURL);
            
            // 从文件名中提取标题（去掉扩展名）
            let title = file.name;
            const lastDotIndex = title.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                title = title.substring(0, lastDotIndex);
            }
            
            // 添加到歌曲数组
            songs.push({
                title: title,
                artist: '未知艺术家', // 可以尝试使用jsmediatags等库获取元数据
                src: objectURL,
                file: file
            });
        }
    });
    
    if (songs.length > 0) {
        // 初始化播放列表并加载第一首歌
        currentSongIndex = 0;
        initPlaylist();
        loadSong(0);
    } else {
        alert("未选择有效的音频文件！");
    }
    
    // 重置文件输入，允许再次选择相同文件
    fileInput.value = '';
});

// 释放所有Object URL
function releaseObjectURLs() {
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    objectURLs = [];
}

// 事件监听
playBtn.addEventListener('click', () => {
    if (songs.length === 0) {
        alert("请先选择本地音乐文件");
        return;
    }
    
    if (audioPlayer.paused || audioPlayer.ended) {
        playSong();
    } else {
        pauseSong();
    }
});

prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('ended', nextSong);
progressBar.addEventListener('click', setProgress);
volumeSlider.addEventListener('input', setVolume);

// 页面卸载时释放Object URL
window.addEventListener('beforeunload', releaseObjectURLs);

// 初始化播放器
initPlaylist();