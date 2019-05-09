/**
 * Created by j_bleach on 2018/8/3.
 */
import React, {Component} from "react";
import "./index.css";
import AudioAnalyser from "../../src/component"

export default class demo extends Component {
    constructor(props) {
        super(props)
        this.state = {
            status: ""
        }
    }

    componentDidMount() {
    }

    controlAudio(status) {
        this.setState({
            status
        })
    }

    changeScheme(e) {
        this.setState({
            audioType: e.target.value
        })
    }

    render() {
        const {status, audioSrc, audioType} = this.state;
        const audioProps = {
            audioType,
            // audioOptions: {sampleRate: 30000}, // Set the output audio sample rate
            status,
            audioSrc,
            timeslice: 1000, //（https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start#Parameters）
            startCallback: (e) => {
                console.log("succ start", e)
            },
            pauseCallback: (e) => {
                console.log("succ pause", e)
            },
            stopCallback: (e) => {
                this.setState({
                    audioSrc: window.URL.createObjectURL(e)
                })
                console.log("succ stop", e)
                // API.uploadToDatabase(e)  ??
            },
            onRecordCallback: (e) => {
                console.log("recording", e)
            },
            errorCallback: (err) => {
                console.log("error", err)
            }
        }
        return (
            <div>
                <AudioAnalyser {...audioProps}>
                    <div className="btn-box">
                        {status !== "recording" &&
                        <i className="iconfont icon-start" title="Start"
                           onClick={() => this.controlAudio("recording")}></i>}
                        {status === "recording" &&
                        <i className="iconfont icon-pause" title="Pause"
                           onClick={() => this.controlAudio("paused")}></i>}
                        <i className="iconfont icon-stop" title="Stop"
                           onClick={() => this.controlAudio("inactive")}></i>
                    </div>
                </AudioAnalyser>
                <p>Select Format for audio file</p>
                <select name="" id="" onChange={(e) => this.changeScheme(e)} value={audioType}>
                    <option value="audio/webm">audio/webm（default）</option>
                    <option value="audio/wav">audio/wav</option>
                    <option value="audio/mp3">audio/mp3</option>
                </select>
            </div>
        );
    }
}