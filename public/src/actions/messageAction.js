import TYPE from '../config/ACTIONTYPE';

export default {
	receiveMsg(msgObj, myselfId) {
		return {
			type: TYPE.RECEIVE_MSG,
			msgObj,
			myselfId
		}
	},

	clearScreen() {
		return {
			type: TYPE.CLEAR_SCREEN
		}
	}
}