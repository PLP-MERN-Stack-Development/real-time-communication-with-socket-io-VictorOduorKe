import React from 'react'

export default function UserList({ users }) {
  return (
    <div>
      <h4 className="font-semibold mb-2 py-4">Users</h4>
      {users?.map((u) => (
        <div key={u._id} className="p-2 border-b last:border-b-0">
          {u.username} <span className="text-sm text-gray-500">{u.online ? '(online)' : '(offline)'}</span>
        </div>
      ))}
    </div>
  )
}
