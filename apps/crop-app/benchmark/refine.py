"""BiRefNet 마스크 후처리 파이프라인 — 알파매팅 + 에지페더링 + 컬러디컨태미네이션"""
import numpy as np
import cv2
from PIL import Image


def generate_trimap(mask_np, erode_px=10, dilate_px=20):
    """이진 마스크로부터 trimap 생성 (0=배경, 128=미확정, 255=전경)"""
    mask_u8 = (mask_np * 255).astype(np.uint8)

    kernel_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erode_px, erode_px))
    kernel_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_px, dilate_px))

    fg = cv2.erode(mask_u8, kernel_e, iterations=1)
    bg_inv = cv2.dilate(mask_u8, kernel_d, iterations=1)

    trimap = np.full_like(mask_u8, 128)
    trimap[fg > 200] = 255
    trimap[bg_inv < 50] = 0

    return trimap


def alpha_matting_guidedfilter(image_np, mask_np, radius=30, eps=1e-3):
    """GuidedFilter 기반 알파 매팅 — trimap 대신 마스크를 직접 정밀화"""
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    mask_f = mask_np.astype(np.float32)

    refined = cv2.ximgproc.guidedFilter(
        guide=gray, src=mask_f, radius=radius, eps=eps
    ) if hasattr(cv2, 'ximgproc') else _guided_filter_manual(gray, mask_f, radius, eps)

    return np.clip(refined, 0, 1)


def _guided_filter_manual(guide, src, radius, eps):
    """opencv-contrib 없을 때 수동 GuidedFilter"""
    ksize = 2 * radius + 1

    mean_I = cv2.blur(guide, (ksize, ksize))
    mean_p = cv2.blur(src, (ksize, ksize))
    mean_Ip = cv2.blur(guide * src, (ksize, ksize))
    mean_II = cv2.blur(guide * guide, (ksize, ksize))

    cov_Ip = mean_Ip - mean_I * mean_p
    var_I = mean_II - mean_I * mean_I

    a = cov_Ip / (var_I + eps)
    b = mean_p - a * mean_I

    mean_a = cv2.blur(a, (ksize, ksize))
    mean_b = cv2.blur(b, (ksize, ksize))

    return mean_a * guide + mean_b


def edge_feathering(alpha_np, blur_px=2):
    """에지 페더링 — 경계 영역만 가우시안 블러"""
    edge = cv2.Canny((alpha_np * 255).astype(np.uint8), 50, 150)
    edge_dilated = cv2.dilate(edge, np.ones((3, 3), np.uint8), iterations=blur_px)
    edge_mask = (edge_dilated > 0).astype(np.float32)

    blurred = cv2.GaussianBlur(alpha_np, (blur_px * 2 + 1, blur_px * 2 + 1), 0)

    result = alpha_np.copy()
    result[edge_mask > 0] = blurred[edge_mask > 0]

    return result


def color_decontamination(image_np, alpha_np, strength=1.0):
    """컬러 디컨태미네이션 — 반투명 영역의 배경색 번짐 제거"""
    img_f = image_np.astype(np.float32) / 255.0
    alpha_3ch = np.stack([alpha_np] * 3, axis=-1)

    boundary = (alpha_np > 0.05) & (alpha_np < 0.95)

    if not np.any(boundary):
        return image_np

    fg_mask = alpha_np > 0.95
    if not np.any(fg_mask):
        return image_np

    fg_mean = img_f[fg_mask].mean(axis=0)

    result = img_f.copy()
    blend = np.clip(alpha_np[boundary] * strength, 0, 1)

    for c in range(3):
        ch = result[:, :, c]
        pixel_vals = ch[boundary]
        corrected = pixel_vals * blend + fg_mean[c] * (1 - blend)
        ch[boundary] = corrected

    return (np.clip(result, 0, 1) * 255).astype(np.uint8)


def refine_mask(image_pil, mask_np, guided_radius=20, guided_eps=1e-3,
                feather_px=2, decontam_strength=0.8):
    """전체 후처리 파이프라인 실행"""
    image_np = np.array(image_pil)

    alpha = alpha_matting_guidedfilter(image_np, mask_np, guided_radius, guided_eps)

    alpha = edge_feathering(alpha, feather_px)

    image_corrected = color_decontamination(image_np, alpha, decontam_strength)

    alpha_u8 = (alpha * 255).astype(np.uint8)
    result = Image.fromarray(image_corrected).convert('RGBA')
    result.putalpha(Image.fromarray(alpha_u8, mode='L'))

    return result, alpha
