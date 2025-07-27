// 音乐数据
let songs = [];
let currentSongIndex = 0;
let objectURLs = [];
let isLoading = false;

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
const songAlbumEl = document.querySelector('.song-album');
const songCoverEl = document.getElementById('song-cover');
const fileInput = document.getElementById('file-input');

// 读取音频文件元数据
function readAudioMetadata(file) {
    return new Promise((resolve) => {
        if (!window.jsmediatags) {
            console.warn('jsmediatags library not loaded');
            resolve({
                title: getFileNameWithoutExtension(file.name),
                artist: '未知艺术家',
                album: '',
                picture: null
            });
            return;
        }

        window.jsmediatags.read(file, {
            onSuccess: function(tag) {
                const tags = tag.tags;
                let picture = null;
                
                // 处理封面图片
                if (tags.picture) {
                    const data = tags.picture.data;
                    const format = tags.picture.format;
                    let base64String = '';
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    picture = `data:${format};base64,${btoa(base64String)}`;
                }

                resolve({
                    title: tags.title || getFileNameWithoutExtension(file.name),
                    artist: tags.artist || '未知艺术家',
                    album: tags.album || '',
                    picture: picture
                });
            },
            onError: function(error) {
                console.warn('Failed to read metadata:', error);
                resolve({
                    title: getFileNameWithoutExtension(file.name),
                    artist: '未知艺术家',
                    album: '',
                    picture: null
                });
            }
        });
    });
}

// 获取音频文件时长
function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = new Audio();
        const objectURL = URL.createObjectURL(file);
        
        audio.addEventListener('loadedmetadata', () => {
            const duration = audio.duration;
            URL.revokeObjectURL(objectURL);
            
            if (!isNaN(duration) && duration > 0) {
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                const durationText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                resolve(durationText);
            } else {
                resolve('0:00');
            }
        });
        
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(objectURL);
            resolve('0:00');
        });
        
        audio.src = objectURL;
    });
}

// 获取不带扩展名的文件名
function getFileNameWithoutExtension(filename) {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
}

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
            <div class="playlist-cover">
                ${song.picture ? `<img src="${song.picture}" alt="封面">` : '<i class="fas fa-music"></i>'}
            </div>
            <div class="song-details">
                <div class="playlist-title">${song.title}</div>
                <div class="playlist-artist">${song.artist}</div>
            </div>
            <div class="playlist-duration">${song.duration || '0:00'}</div>
        `;
        
        songElement.addEventListener('click', () => {
            if (!isLoading) {
                loadSong(index);
                playSong();
            }
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
    songArtistEl.textContent = song.artist;
    songAlbumEl.textContent = song.album;
    
    // 更新封面
    if (song.picture) {
        songCoverEl.innerHTML = `<img src="${song.picture}" alt="封面">`;
    } else {
        songCoverEl.innerHTML = '<i class="fas fa-music"></i>';
    }
    
    audioPlayer.src = song.src;
    currentSongIndex = index;
    
    // 重置进度条
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    
    // 设置时长显示
    durationEl.textContent = song.duration || '0:00';
}

// 播放歌曲
function playSong() {
    if (isLoading || songs.length === 0) return;
    
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
    if (songs.length === 0 || isLoading) return;
    
    currentSongIndex++;
    if (currentSongIndex >= songs.length) {
        currentSongIndex = 0;
    }
    loadSong(currentSongIndex);
    playSong();
}

// 上一首
function prevSong() {
    if (songs.length === 0 || isLoading) return;
    
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

// 显示加载状态
function showLoading() {
    playlistEl.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> 正在读取音频文件数据...</div>';
}

// 处理文件选择
fileInput.addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    isLoading = true;
    showLoading();
    
    // 释放之前创建的Object URL
    releaseObjectURLs();
    
    // 重置歌曲数组
    songs = [];
    
    // 处理每个文件
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
        alert("未选择有效的音频文件！");
        isLoading = false;
        initPlaylist();
        return;
    }
    
    // 并行处理所有文件的元数据和时长
    const songPromises = audioFiles.map(async (file) => {
        const objectURL = URL.createObjectURL(file);
        objectURLs.push(objectURL);
        
        // 同时获取元数据和时长
        const [metadata, duration] = await Promise.all([
            readAudioMetadata(file),
            getAudioDuration(file)
        ]);
        
        return {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            picture: metadata.picture,
            src: objectURL,
            file: file,
            duration: duration
        };
    });
    
    try {
        songs = await Promise.all(songPromises);
        
        if (songs.length > 0) {
            currentSongIndex = 0;
            initPlaylist();
            loadSong(0);
        }
    } catch (error) {
        console.error('Error processing files:', error);
        alert("处理文件时出现错误，请重试。");
    } finally {
        isLoading = false;
    }
    
    // 重置文件输入
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
audioPlayer.volume = volumeSlider.value;
initPlaylist();