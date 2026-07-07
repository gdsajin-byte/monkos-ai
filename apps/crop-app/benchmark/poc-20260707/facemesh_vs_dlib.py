import sys, time, os
import cv2
import numpy as np
import dlib
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DLIB_MODEL = os.path.join(SCRIPT_DIR, "shape_predictor_68_face_landmarks.dat")
MP_MODEL = os.path.join(SCRIPT_DIR, "face_landmarker.task")


def run_facemesh(img_rgb):
    options = FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MP_MODEL),
        num_faces=1,
        output_face_blendshapes=False,
        output_facial_transformation_matrixes=False,
    )
    landmarker = FaceLandmarker.create_from_options(options)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    t0 = time.time()
    result = landmarker.detect(mp_image)
    t1 = time.time()
    landmarker.close()

    if not result.face_landmarks:
        return None, t1 - t0

    lm = result.face_landmarks[0]
    h, w = img_rgb.shape[:2]

    # MediaPipe Tasks landmarks — same indices as FaceMesh solutions
    # Eyes: #468 (left iris center), #473 (right iris center)
    # Chin: #152
    # Nose: #1
    # Forehead: #10
    # Eye standard: #159 (left), #386 (right)
    def pt(i):
        return (int(lm[i].x * w), int(lm[i].y * h))

    has_iris = len(lm) > 473
    left_eye = pt(468) if has_iris else pt(159)
    right_eye = pt(473) if has_iris else pt(386)
    left_eye_std = pt(159)
    right_eye_std = pt(386)
    chin = pt(152)
    nose = pt(1)
    forehead = pt(10)

    return {
        "left_eye": left_eye, "right_eye": right_eye,
        "left_eye_std": left_eye_std, "right_eye_std": right_eye_std,
        "chin": chin, "nose": nose, "forehead": forehead,
        "eye_center_y": (left_eye[1] + right_eye[1]) // 2,
        "n_landmarks": len(lm),
    }, t1 - t0


def run_dlib(img_rgb):
    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor(DLIB_MODEL)

    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    t0 = time.time()
    faces = detector(gray, 1)
    if len(faces) == 0:
        return None, time.time() - t0

    shape = predictor(gray, faces[0])
    t1 = time.time()

    def pt(i):
        return (shape.part(i).x, shape.part(i).y)

    def center(indices):
        xs = [shape.part(i).x for i in indices]
        ys = [shape.part(i).y for i in indices]
        return (sum(xs) // len(xs), sum(ys) // len(ys))

    left_eye = center(range(36, 42))
    right_eye = center(range(42, 48))
    chin = pt(8)
    nose = pt(30)
    face = faces[0]
    forehead = ((face.left() + face.right()) // 2, face.top())

    return {
        "left_eye": left_eye, "right_eye": right_eye,
        "chin": chin, "nose": nose, "forehead": forehead,
        "eye_center_y": (left_eye[1] + right_eye[1]) // 2,
        "face_rect": (face.left(), face.top(), face.right(), face.bottom()),
    }, t1 - t0


def draw_comparison(img_rgb, fm_res, dlib_res, out_path, label):
    vis = img_rgb.copy()
    h, w = vis.shape[:2]
    r = max(5, min(12, w // 120))

    if fm_res:
        for key in ["left_eye", "right_eye", "chin", "nose", "forehead"]:
            p = fm_res[key]
            cv2.circle(vis, p, r, (255, 50, 50), -1)
            cv2.circle(vis, p, r + 2, (255, 50, 50), 2)
        cv2.line(vis, fm_res["left_eye"], fm_res["right_eye"], (255, 50, 50), 2)

    if dlib_res:
        for key in ["left_eye", "right_eye", "chin", "nose", "forehead"]:
            p = dlib_res[key]
            cv2.circle(vis, p, r, (50, 50, 255), -1)
            cv2.circle(vis, p, r + 2, (50, 50, 255), 2)
        cv2.line(vis, dlib_res["left_eye"], dlib_res["right_eye"], (50, 50, 255), 2)
        if "face_rect" in dlib_res:
            rc = dlib_res["face_rect"]
            cv2.rectangle(vis, (rc[0], rc[1]), (rc[2], rc[3]), (50, 50, 255), 2)

    # Legend
    lh = 70
    cv2.rectangle(vis, (10, h - lh - 10), (300, h - 10), (0, 0, 0), -1)
    cv2.rectangle(vis, (10, h - lh - 10), (300, h - 10), (80, 80, 80), 1)
    cv2.circle(vis, (30, h - lh + 10), 8, (255, 50, 50), -1)
    cv2.putText(vis, "FaceMesh (MediaPipe)", (50, h - lh + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    cv2.circle(vis, (30, h - lh + 40), 8, (50, 50, 255), -1)
    cv2.putText(vis, "dlib 68pt", (50, h - lh + 45), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

    # Title bar
    cv2.rectangle(vis, (0, 0), (w, 40), (0, 0, 0), -1)
    cv2.putText(vis, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imwrite(out_path, cv2.cvtColor(vis, cv2.COLOR_RGB2BGR))


def main():
    tests = [
        ("/Users/macmini/Desktop/dawn-original.jpg", "landmark_compare_dawn", "dawn (selfie, indoor bg)"),
        ("/Users/macmini/Downloads/krivitskiy-girl-5138811_1920.jpg", "landmark_compare_closeup", "closeup (dark bg, open mouth)"),
        ("/Users/macmini/Downloads/my_id_photo.jpg", "landmark_compare_idphoto", "idphoto (glasses, half-body)"),
    ]

    print()
    print(f"{'이미지':<30} {'엔진':<14} {'감지':<6} {'눈Y':<8} {'턱Y':<8} {'코Y':<8} {'속도':<8}")
    print("-" * 90)

    all_results = []

    for src, name, label in tests:
        if not os.path.exists(src):
            print(f"{name:<30} 파일 없음: {src}")
            continue

        img = cv2.imread(src)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]

        fm_res, fm_time = run_facemesh(img_rgb)
        dlib_res, dlib_time = run_dlib(img_rgb)

        out_path = f"/Users/macmini/Desktop/{name}.png"
        draw_comparison(img_rgb, fm_res, dlib_res, out_path, label)

        if fm_res:
            print(f"{name:<30} {'FaceMesh':<14} {'OK':<6} {fm_res['eye_center_y']:<8} {fm_res['chin'][1]:<8} {fm_res['nose'][1]:<8} {fm_time:.3f}s")
        else:
            print(f"{name:<30} {'FaceMesh':<14} {'FAIL':<6} {'-':<8} {'-':<8} {'-':<8} {fm_time:.3f}s")

        if dlib_res:
            print(f"{'':<30} {'dlib':<14} {'OK':<6} {dlib_res['eye_center_y']:<8} {dlib_res['chin'][1]:<8} {dlib_res['nose'][1]:<8} {dlib_time:.3f}s")
        else:
            print(f"{'':<30} {'dlib':<14} {'FAIL':<6} {'-':<8} {'-':<8} {'-':<8} {dlib_time:.3f}s")

        if fm_res and dlib_res:
            eye_diff = abs(fm_res["eye_center_y"] - dlib_res["eye_center_y"])
            chin_diff = abs(fm_res["chin"][1] - dlib_res["chin"][1])
            nose_diff = abs(fm_res["nose"][1] - dlib_res["nose"][1])
            print(f"{'':<30} {'Δ (px)':<14} {'':<6} {eye_diff:<8} {chin_diff:<8} {nose_diff:<8}")

        all_results.append({
            "name": name, "label": label, "w": w, "h": h,
            "fm": fm_res, "fm_time": fm_time,
            "dlib": dlib_res, "dlib_time": dlib_time,
        })
        print()

    # Summary
    print("=" * 90)
    fm_ok = sum(1 for r in all_results if r["fm"])
    dlib_ok = sum(1 for r in all_results if r["dlib"])
    fm_avg = np.mean([r["fm_time"] for r in all_results]) if all_results else 0
    dlib_avg = np.mean([r["dlib_time"] for r in all_results]) if all_results else 0
    print(f"감지 성공: FaceMesh {fm_ok}/{len(all_results)}, dlib {dlib_ok}/{len(all_results)}")
    print(f"평균 속도: FaceMesh {fm_avg:.3f}s, dlib {dlib_avg:.3f}s")


if __name__ == "__main__":
    main()
