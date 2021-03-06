var _createClass = function () { 
    function defineProperties(target, props) { 
        for (var i = 0; i < props.length; i++) { 
            var descriptor = props[i]; 
            descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; 
            if ("value" in descriptor) descriptor.writable = true; 
            Object.defineProperty(target, descriptor.key, descriptor); 
        } 
    } 
    return function (Constructor, protoProps, staticProps) { 
        if (protoProps) defineProperties(Constructor.prototype, protoProps); 
        if (staticProps) defineProperties(Constructor, staticProps); 
        return Constructor; 
    }; 
}();

function _classCallCheck(instance, Constructor) { 
    if (!(instance instanceof Constructor)) { 
        throw new TypeError("Cannot call a class as a function"); 
    } 
}

function _possibleConstructorReturn(self, call) { 
    if (!self) { 
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); 
    } 
    return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { 
    if (typeof superClass !== "function" && superClass !== null) { 
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); 
    } 
    subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); 
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; 
}

/**
 * @author j_bleach 2018/8/18
 * @describe 媒体记录（包含开始，暂停，停止等媒体流及回调操作）
 * @param Target 被装饰类（AudioAnalyser）
 */
import convertWav from "./audioConvertWav";
import WebWorker from "./mp3worker.js";

var MediaRecorderFn = function MediaRecorderFn(Target) {
    var _class, _temp;

    var constraints = { audio: true };
    var mp3Worker = new Worker(WebWorker);
    return _temp = _class = function (_Target) {
        _inherits(MediaRecorderClass, _Target);

        // 音频上下文

        // 音频信息存储对象
        function MediaRecorderClass(props) {
            _classCallCheck(this, MediaRecorderClass);

            var _this = _possibleConstructorReturn(this, (MediaRecorderClass.__proto__ || Object.getPrototypeOf(MediaRecorderClass)).call(this, props));

            _this.startAudio = function () {
                var recorder = MediaRecorderClass.mediaRecorder;
                if (!recorder || recorder && recorder.state === "inactive") {
                    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                        _this.recordAudio(stream);
                    }).catch(function (err) {
                        MediaRecorderClass.checkAndExecFn(_this.props.errorCallback, err);
                        // throw new Error("getUserMedia failed:", err);
                    });
                    return false;
                }
                if (recorder && recorder.state === "paused") {
                    MediaRecorderClass.resumeAudio();
                }
            };

            _this.pauseAudio = function () {
                var recorder = MediaRecorderClass.mediaRecorder;
                if (recorder && recorder.state === "recording") {
                    recorder.pause();
                    recorder.onpause = function () {
                        MediaRecorderClass.checkAndExecFn(_this.props.pauseCallback);
                    };
                    MediaRecorderClass.audioCtx.suspend();
                }
            };

            _this.stopAudio = function () {
                var _this$props = _this.props,
                    audioType = _this$props.audioType,
                    audioOptions = _this$props.audioOptions;

                var recorder = MediaRecorderClass.mediaRecorder;
                if (recorder && ["recording", "paused"].includes(recorder.state)) {
                    recorder.stop();
                    recorder.onstop = function () {
                        MediaRecorderClass.audioStream2Blob(audioType, audioOptions, _this.props.stopCallback);
                        MediaRecorderClass.audioChunk = []; // Empty audio storage after the end
                    };
                    MediaRecorderClass.audioCtx.suspend();
                    _this.initCanvas();
                }
            };

            MediaRecorderClass.compatibility();
            _this.analyser = MediaRecorderClass.audioCtx.createAnalyser();
            return _this;
        }

        /**
         * @author j_bleach 2018/08/02 17:06
         * @describe 浏览器navigator.mediaDevices兼容性处理
         */
        // 媒体记录对象


        _createClass(MediaRecorderClass, [{
            key: "recordAudio",


            /**
             * @author j_bleach 2018/8/18
             * @describe mediaRecorder音频记录
             * @param stream: binary data 音频流
             */
            value: function recordAudio(stream) {
                var _this2 = this;

                var _props = this.props,
                    audioBitsPerSecond = _props.audioBitsPerSecond,
                    mimeType = _props.mimeType,
                    timeslice = _props.timeslice;

                MediaRecorderClass.mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: audioBitsPerSecond, mimeType: mimeType });
                MediaRecorderClass.mediaRecorder.ondataavailable = function (event) {
                    MediaRecorderClass.checkAndExecFn(_this2.props.onRecordCallback, event.data);
                    MediaRecorderClass.audioChunk.push(event.data);
                };
                MediaRecorderClass.audioCtx.resume();
                MediaRecorderClass.mediaRecorder.start(timeslice);
                MediaRecorderClass.mediaRecorder.onstart = function (e) {
                    MediaRecorderClass.checkAndExecFn(_this2.props.startCallback, e);
                };
                MediaRecorderClass.mediaRecorder.onresume = function (e) {
                    MediaRecorderClass.checkAndExecFn(_this2.props.startCallback, e);
                };
                MediaRecorderClass.mediaRecorder.onerror = function (e) {
                    MediaRecorderClass.checkAndExecFn(_this2.props.errorCallback, e);
                };
                var source = MediaRecorderClass.audioCtx.createMediaStreamSource(stream);
                source.connect(this.analyser);
                this.renderCurve(this.analyser);
            }

            /**
             * @author j_bleach 2018/8/19
             * @describe 恢复录音
             */

        }], [{
            key: "compatibility",
            value: function compatibility() {
                var _this3 = this;

                var promisifiedOldGUM = function promisifiedOldGUM(constraints) {
                    // First get ahold of getUserMedia, if present
                    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

                    // Some browsers just don't implement it - return a rejected promise with an error
                    // to keep a consistent interface
                    if (!getUserMedia) {
                        MediaRecorderClass.checkAndExecFn(_this3.props.errorCallback);
                        return Promise.reject(new Error("getUserMedia is not implemented in this browser"));
                    }
                    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                };

                // Older browsers might not implement mediaDevices at all, so we set an empty object first
                if (navigator.mediaDevices === undefined) {
                    navigator.mediaDevices = {};
                }

                // Some browsers partially implement mediaDevices. We can't just assign an object
                // with getUserMedia as it would overwrite existing properties.
                // Here, we will just add the getUserMedia property if it's missing.
                if (navigator.mediaDevices.getUserMedia === undefined) {
                    navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
                }
            }

            /**
             * @author j_bleach 2018/8/19
             * @describe 验证函数，如果存在即执行
             * @param fn: function 被验证函数
             * @param e: object 事件对象 event object
             */

        }, {
            key: "checkAndExecFn",
            value: function checkAndExecFn(fn, e) {
                typeof fn === "function" && fn(e);
            }

            /**
             * @author j_bleach 2018/8/19
             * @describe 音频流转blob对象
             * @param type: string 音频的mime-type
             * @param cb: function 录音停止回调
             */

        }, {
            key: "audioStream2Blob",
            value: function audioStream2Blob(type, audioOptions, cb) {
                var wavBlob = null;
                var chunk = MediaRecorderClass.audioChunk;
                var audioWav = function audioWav() {
                    var fr = new FileReader();
                    fr.readAsArrayBuffer(new Blob(chunk, { type: type }));
                    var frOnload = function frOnload(e) {
                        var buffer = e.target.result;
                        MediaRecorderClass.audioCtx.decodeAudioData(buffer).then(function (data) {
                            wavBlob = new Blob([new DataView(convertWav(data, audioOptions))], {
                                type: "audio/wav"
                            });
                            MediaRecorderClass.checkAndExecFn(cb, wavBlob);
                        });
                    };
                    fr.onload = frOnload;
                };
                var audioMp3 = function audioMp3() {
                    var fr = new FileReader();
                    fr.readAsArrayBuffer(new Blob(chunk, { type: "audio/wav" }));
                    var frOnload = function frOnload(e) {
                        var buffer = e.target.result;
                        MediaRecorderClass.audioCtx.decodeAudioData(buffer).then(function (data) {
                            var wavBuf = convertWav(data, audioOptions);
                            mp3Worker.postMessage({
                                cmd: "init",
                                config: { bitRate: 128 }
                            });
                            mp3Worker.postMessage({ cmd: "encode", rawInput: wavBuf });
                            mp3Worker.postMessage({ cmd: "finish" });

                            mp3Worker.onmessage = function (e) {
                                if (e.data.cmd == "end") {
                                    var mp3Blob = new Blob(e.data.buf, { type: type });
                                    MediaRecorderClass.checkAndExecFn(cb, mp3Blob);
                                }
                            };
                        });
                    };
                    fr.onload = frOnload;
                };
                switch (type) {
                    case "audio/webm":
                        MediaRecorderClass.checkAndExecFn(cb, new Blob(chunk, { type: type }));
                        break;
                    case "audio/wav":
                        audioWav();
                        break;
                    case "audio/mp3":
                        audioMp3();
                        break;
                    default:
                        return void 0;
                }
            }

            /**
             * @author j_bleach 2018/8/18
             * @describe 开始录音
             */

            /**
             * @author j_bleach 2018/8/19
             * @describe 暂停录音
             */

            /**
             * @author j_bleach 2018/8/18
             * @describe 停止录音
             */

        }, {
            key: "resumeAudio",
            value: function resumeAudio() {
                MediaRecorderClass.audioCtx.resume();
                MediaRecorderClass.mediaRecorder.resume();
            }
        }]);

        return MediaRecorderClass;
    }(Target), _class.audioChunk = [], _class.mediaRecorder = null, _class.audioCtx = new (window.AudioContext || window.webkitAudioContext)(), _temp;
};
export default MediaRecorderFn;
//# sourceMappingURL=MediaRecorder.js.map