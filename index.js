const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT

const io = require('socket.io')(PORT, {
    cors: {
        origin: 'http://localhost:3000'
    }
});

let users = [];

const addUser = (userId, userName, img, socketId) => {
    !users.some((user) => user.userId === userId) && users.push({ userId, userName, img, socketId });
}

const removeUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId)
}

const getUser = (userId) => {
    return users.find(user => user.userId === userId);
}

io.on('connection', (socket) => {
    console.log("a user connected");
    // add user from client socket
    socket.on('addUser', ({ userId, userName, img }) => {
        addUser(userId, userName, img, socket.id);
        io.emit('getUsers', users);
    });

    // send and get message
    socket.on('sendMessage', ({ senderId, receiverId, text }) => {
        const user = getUser(receiverId);
        if (user) {
            io.to(user.socketId).emit('getMessage', { senderId, text });
        }
    });

    socket.on('messageNotify', ({ senderId, receiverId, waitToken }) => {
        const receiverUser = getUser(receiverId);
        const senderUser = getUser(senderId);
        if (receiverUser && senderUser) {
            io.to(receiverUser.socketId).emit('getMessageNotify', 
            { 
                senderName: senderUser.userName, 
                sender: senderUser.userId, 
                action: 'đã nhắn tin cho bạn 📧', 
                seen: false, 
                waitToken 
            });
        }
    });

    socket.on('friendsTag', ({ senderId, receiverId, waitToken }) => {
        const senderUser = getUser(senderId);
        receiverId.forEach((receiver) => {
            const receiverUser = getUser(receiver);
            if (receiverUser) {
                io.to(receiverUser.socketId).emit('getFriendsTag', 
                { 
                    senderName: senderUser.userName, 
                    sender: senderUser.userId, 
                    action: 'đã triệu hồi bạn trong một bài viết 👨‍💻', 
                    seen: false, 
                    waitToken 
                });
            }
        })
    });

    socket.on('friendsNotify', ({ senderId, receiverId, waitToken }) => {
        const senderUser = getUser(senderId);
        const receiverUser = getUser(receiverId);
        if (receiverUser) {
            io.to(receiverUser.socketId).emit('getFriendsNotify', 
            { 
                senderName: senderUser.userName, 
                sender: senderUser.userId, 
                action: 'đã bắt đầu theo dõi bạn 👀', 
                seen: false, 
                waitToken 
            });
        }
    });

    socket.on('likeNotify', ({ senderId, receiverId, waitToken, postId }) => {
        const senderUser = getUser(senderId);
        const receiverUser = getUser(receiverId);
        if (receiverUser) {
            io.to(receiverUser.socketId).emit('getLikeNotify', 
            { 
                senderName: senderUser.userName, 
                sender: senderUser.userId, 
                action: 'đã thích bài biết của bạn ❤️', 
                seen: false, 
                waitToken, 
                postId 
            });
        }
    });

    socket.on('commentNotify', ({ senderId, receiverId, waitToken, postId }) => {
        const senderUser = getUser(senderId);
        const receiverUser = getUser(receiverId);
        if (receiverUser) {
            io.to(receiverUser.socketId).emit('getCommentNotify', 
            { 
                senderName: senderUser.userName, 
                sender: senderUser.userId, 
                action: 'đã bình luận bài viết của bạn 📝', 
                seen: false, 
                waitToken, 
                postId 
            });
        }
    })

    socket.on('disconnect', () => {
        console.log("a user disconnected");
        removeUser(socket.id);
        io.emit('getUsers', users);
    });
});