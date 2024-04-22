export function onMouseMove(event, appInstance) {
    event.preventDefault();

    // 마우스 위치를 정규화된 장치 좌표로 변환
    appInstance._mouse.x = (event.clientX / appInstance._divContainer.clientWidth) * 2 - 1;
    appInstance._mouse.y = -(event.clientY / appInstance._divContainer.clientHeight) * 2 + 1;

    // Raycaster 업데이트
    appInstance._raycaster.setFromCamera(appInstance._mouse, appInstance._camera);

    // 교차하는 객체 찾기
    const intersects = appInstance._raycaster.intersectObjects(appInstance._scene.children);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        if (intersected.name === "clickableBox") {
            if (appInstance._highlighted !== intersected) {
                // 이전에 강조된 객체가 있으면 원래 색상으로 되돌림
                if (appInstance._highlighted) {
                    appInstance._highlighted.material.color.set(appInstance._originalColor);
                }
                // 새로운 객체 강조
                appInstance._originalColor.copy(intersected.material.color); // 원래 색상 저장
                intersected.material.color.set(0xff0000); // 강조 색상으로 변경
                appInstance._highlighted = intersected; // 현재 강조된 객체 업데이트
            }
        } else if (appInstance._highlighted) {
            // 마우스가 다른 객체로 이동했을 때 원래 색상으로 되돌림
            appInstance._highlighted.material.color.set(appInstance._originalColor);
            appInstance._highlighted = null;
        }
    } else if (appInstance._highlighted) {
        // 마우스가 모든 객체에서 벗어났을 때 원래 색상으로 되돌림
        appInstance._highlighted.material.color.set(appInstance._originalColor);
        appInstance._highlighted = null;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const option1Button = document.getElementById('option1');
    const select1Button = document.getElementById('select1');
    
    const eventHandler = () => {
        fetch('http://127.0.0.1:3000/api/hello')
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    };
    
    option1Button.addEventListener('click', eventHandler);
    select1Button.addEventListener('click', eventHandler);
});

document.addEventListener('DOMContentLoaded', () => {
    const option1Button = document.getElementById('option2');
    
    option1Button.addEventListener('click', () => {
        const requestOptions = {
            method: 'POST', // 메소드 타입
            headers: {
                'Content-Type': 'application/json', // 컨텐츠 타입
            },
            body: JSON.stringify({
                id: 'wkdgks', // 서버로 보낼 데이터
                score : 10
            }),
        };
        
        // fetch 함수를 사용하여 POST 요청 보내기
        fetch('http://127.0.0.1:3000/api/hello', requestOptions)
            .then(response => response.json())
            .then(data => console.log(data)) // 응답 데이터 처리
            .catch(error => console.error('Error:', error)); // 에러 처리
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const option1Button = document.getElementById('select2');
    
    option1Button.addEventListener('click', () => {
        const requestOptions = {
            method: 'POST', // 메소드 타입
            headers: {
                'Content-Type': 'application/json', // 컨텐츠 타입
            },
            body: JSON.stringify({
                id: 'wkdgks', // 서버로 보낼 데이터
                score : 10
            }),
        };
        
        // fetch 함수를 사용하여 POST 요청 보내기
        fetch('http://127.0.0.1:3000/api/hello', requestOptions)
            .then(response => response.json())
            .then(data => console.log(data)) // 응답 데이터 처리
            .catch(error => console.error('Error:', error)); // 에러 처리
    });
});
