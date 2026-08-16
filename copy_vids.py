import os, shutil

src = '/home/aarock17/Downloads/WhatSie'
dst = '/home/aarock17/portfolio/videos'
scratch_dst = '/home/aarock17/.gemini/antigravity/scratch/portfolio/videos'

os.makedirs(dst, exist_ok=True)
os.makedirs(scratch_dst, exist_ok=True)

v17 = os.path.join(src, 'WhatsApp Video 2026-07-17 at 11.14.45 AM.mp4')
v13 = os.path.join(src, 'WhatsApp Video 2026-07-13 at 6.37.18 AM.mp4')

if os.path.exists(v17):
    shutil.copy(v17, os.path.join(dst, 'amr_leader_follower.mp4'))
    shutil.copy(v17, os.path.join(scratch_dst, 'amr_leader_follower.mp4'))
    print("Copied amr_leader_follower.mp4")

if os.path.exists(v13):
    shutil.copy(v13, os.path.join(dst, 'two_wheel_robot.mp4'))
    shutil.copy(v13, os.path.join(scratch_dst, 'two_wheel_robot.mp4'))
    print("Copied two_wheel_robot.mp4")
